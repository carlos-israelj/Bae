use anyhow::{Result, anyhow};
use rumqttc::{AsyncClient, Event, EventLoop, MqttOptions, Packet, QoS};
use serde::{Deserialize, Serialize};
use tracing::{info, error, warn};
use std::sync::Arc;
use tokio::sync::Mutex;

mod crypto;
mod blockchain_sender;

use crypto::CryptoHandler;
use blockchain_sender::BlockchainSender;

#[derive(Debug, Serialize, Deserialize)]
struct SensorReading {
    device_id: String,
    temperature: f32,
    humidity: f32,
    timestamp: u64,
}

struct Gateway {
    mqtt_client: AsyncClient,
    mqtt_eventloop: EventLoop,
    crypto: CryptoHandler,
    blockchain: Arc<Mutex<BlockchainSender>>,
    stats: Arc<Mutex<GatewayStats>>,
}

#[derive(Debug, Default)]
struct GatewayStats {
    messages_received: u64,
    messages_processed: u64,
    messages_failed: u64,
    transactions_sent: u64,
    transactions_confirmed: u64,
}

impl Gateway {
    async fn new(
        mqtt_broker: &str,
        mqtt_port: u16,
        rpc_url: &str,
        contract_address: &str,
        private_key: &str,
        encryption_key: &str,
    ) -> Result<Self> {
        info!("🔧 Initializing Gateway...");
        
        // Configuración MQTT mejorada
        let mut mqttoptions = MqttOptions::new("bae-gateway", mqtt_broker, mqtt_port);
        mqttoptions.set_keep_alive(std::time::Duration::from_secs(30));
        mqttoptions.set_clean_session(true);
        mqttoptions.set_max_packet_size(1024 * 1024, 1024 * 1024); // 1MB límite
        
        let (mqtt_client, mqtt_eventloop) = AsyncClient::new(mqttoptions, 10);
        
        info!("🔐 Initializing crypto handler...");
        let crypto = CryptoHandler::new(encryption_key)?;
        
        info!("🔗 Connecting to blockchain...");
        let blockchain = BlockchainSender::new(rpc_url, contract_address, private_key).await?;
        
        Ok(Self { 
            mqtt_client, 
            mqtt_eventloop, 
            crypto, 
            blockchain: Arc::new(Mutex::new(blockchain)),
            stats: Arc::new(Mutex::new(GatewayStats::default())),
        })
    }

    async fn start(&mut self) -> Result<()> {
        // Suscribirse al topic de sensores
        self.mqtt_client.subscribe("bae/sensors/+/data", QoS::AtLeastOnce).await?;
        
        info!("✅ Gateway listening on MQTT topic: bae/sensors/+/data");
        info!("🔗 Connected to Paseo Hub");
        info!("📊 Gateway ready to process sensor data");
        info!("");
        
        // Spawn task para mostrar estadísticas periódicamente
        let stats_clone = self.stats.clone();
        tokio::spawn(async move {
            let mut interval = tokio::time::interval(tokio::time::Duration::from_secs(60));
            loop {
                interval.tick().await;
                let stats = stats_clone.lock().await;
                info!("📊 Stats (last 60s): Received={}, Processed={}, Failed={}, TX Sent={}, TX Confirmed={}", 
                    stats.messages_received, 
                    stats.messages_processed, 
                    stats.messages_failed,
                    stats.transactions_sent,
                    stats.transactions_confirmed
                );
            }
        });
        
        // Loop principal de eventos MQTT
        loop {
            match self.mqtt_eventloop.poll().await {
                Ok(Event::Incoming(Packet::ConnAck(_))) => {
                    info!("📡 Connected to MQTT broker");
                }
                Ok(Event::Incoming(Packet::Publish(publish))) => {
                    let mut stats = self.stats.lock().await;
                    stats.messages_received += 1;
                    drop(stats);
                    
                    // Procesar mensaje en una tarea separada para no bloquear el loop
                    let payload = publish.payload.to_vec();
                    let crypto = self.crypto.clone();
                    let blockchain = self.blockchain.clone();
                    let stats = self.stats.clone();
                    
                    tokio::spawn(async move {
                        match Self::process_sensor_data(payload, crypto, blockchain).await {
                            Ok(_) => {
                                let mut s = stats.lock().await;
                                s.messages_processed += 1;
                            }
                            Err(e) => {
                                error!("❌ Processing error: {}", e);
                                let mut s = stats.lock().await;
                                s.messages_failed += 1;
                            }
                        }
                    });
                }
                Ok(Event::Incoming(Packet::Disconnect)) => {
                    warn!("⚠️  Disconnected from MQTT broker");
                }
                Ok(_) => {}
                Err(e) => {
                    error!("❌ MQTT error: {}", e);
                    tokio::time::sleep(tokio::time::Duration::from_secs(5)).await;
                }
            }
        }
    }

    async fn process_sensor_data(
        payload: Vec<u8>,
        crypto: CryptoHandler,
        blockchain: Arc<Mutex<BlockchainSender>>,
    ) -> Result<()> {
        // Parsear datos del sensor
        let reading: SensorReading = serde_json::from_slice(&payload)
            .map_err(|e| anyhow!("Failed to parse sensor data: {}", e))?;
        
        // Validar datos
        Self::validate_reading(&reading)?;
        
        info!(
            "📥 {} | T={:.1}°C H={:.1}% | ts={}",
            reading.device_id, reading.temperature, reading.humidity, reading.timestamp
        );
        
        // Encriptar datos
        let encrypted = crypto.encrypt(&reading)
            .map_err(|e| anyhow!("Encryption failed: {}", e))?;
        
        // Generar firma
        let signature = crypto.sign(&encrypted)
            .map_err(|e| anyhow!("Signing failed: {}", e))?;
        
        info!("🔐 Data encrypted (ciphertext: {} bytes, nonce: {} bytes)", 
            encrypted.ciphertext.len(), encrypted.nonce.len());
        
        // Enviar a blockchain con retry logic
        let mut attempts = 0;
        let max_attempts = 3;
        
        loop {
            attempts += 1;
            
            let blockchain_guard = blockchain.lock().await;
            match blockchain_guard.submit_sensor_data(
                &reading.device_id,
                &encrypted.ciphertext,
                &encrypted.nonce,
                &signature,
                reading.timestamp,
            ).await {
                Ok(tx_hash) => {
                    info!("✅ TX confirmed: {}", tx_hash);
                    return Ok(());
                }
                Err(e) if attempts < max_attempts => {
                    warn!("⚠️  Attempt {}/{} failed: {}. Retrying...", attempts, max_attempts, e);
                    drop(blockchain_guard);
                    tokio::time::sleep(tokio::time::Duration::from_secs(5)).await;
                }
                Err(e) => {
                    error!("❌ All {} attempts failed: {}", max_attempts, e);
                    return Err(e);
                }
            }
        }
    }

    fn validate_reading(reading: &SensorReading) -> Result<()> {
        // Validar device_id
        if reading.device_id.is_empty() || reading.device_id.len() > 100 {
            return Err(anyhow!("Invalid device_id length"));
        }
        
        // Validar rangos de temperatura (-50°C a 100°C)
        if !(-50.0..=100.0).contains(&reading.temperature) {
            return Err(anyhow!("Temperature out of range: {}", reading.temperature));
        }
        
        // Validar rangos de humedad (0% a 100%)
        if !(0.0..=100.0).contains(&reading.humidity) {
            return Err(anyhow!("Humidity out of range: {}", reading.humidity));
        }
        
        // Validar timestamp (no puede ser futuro ni muy antiguo)
        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs();
        
        let max_age = 3600; // 1 hora
        let max_future = 300; // 5 minutos
        
        if reading.timestamp > now + max_future {
            return Err(anyhow!("Timestamp is in the future"));
        }
        
        if reading.timestamp + max_age < now {
            return Err(anyhow!("Timestamp is too old"));
        }
        
        Ok(())
    }
}

#[tokio::main]
async fn main() -> Result<()> {
    // Cargar .env si existe (para desarrollo local)
    dotenv::dotenv().ok();
    
    // Inicializar logging
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::from_default_env()
                .add_directive("gateway=info".parse().unwrap())
        )
        .init();
    
    info!("🚀 Starting Bae Gateway v0.1.0");
    info!("");
    
    // Leer configuración
    let mqtt_broker = std::env::var("MQTT_BROKER")
        .unwrap_or_else(|_| "broker.hivemq.com".to_string());
    let mqtt_port: u16 = std::env::var("MQTT_PORT")
        .unwrap_or_else(|_| "1883".to_string())
        .parse()
        .map_err(|_| anyhow!("Invalid MQTT_PORT"))?;
    let rpc_url = std::env::var("RPC_URL")
        .map_err(|_| anyhow!("RPC_URL must be set"))?;
    let contract_address = std::env::var("CONTRACT_ADDRESS")
        .map_err(|_| anyhow!("CONTRACT_ADDRESS must be set"))?;
    let private_key = std::env::var("PRIVATE_KEY")
        .map_err(|_| anyhow!("PRIVATE_KEY must be set"))?;
    let encryption_key = std::env::var("ENCRYPTION_KEY")
        .unwrap_or_else(|_| {
            warn!("⚠️  ENCRYPTION_KEY not set, using default (NOT SECURE FOR PRODUCTION)");
            "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef".to_string()
        });
    
    // Mostrar configuración (ocultar claves sensibles)
    info!("⚙️  Configuration:");
    info!("   MQTT Broker: {}:{}", mqtt_broker, mqtt_port);
    info!("   RPC URL: {}", rpc_url);
    info!("   Contract: {}", contract_address);
    info!("   Private Key: {}...{}", &private_key[..10], &private_key[private_key.len()-4..]);
    info!("   Encryption Key: configured ({} bytes)", encryption_key.len() / 2);
    info!("");
    
    // Crear y arrancar gateway
    let mut gateway = Gateway::new(
        &mqtt_broker,
        mqtt_port,
        &rpc_url,
        &contract_address,
        &private_key,
        &encryption_key
    ).await?;
    
    gateway.start().await
}