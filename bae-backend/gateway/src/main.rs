use anyhow::Result;
use rumqttc::{AsyncClient, Event, EventLoop, MqttOptions, Packet, QoS};
use serde::{Deserialize, Serialize};
use tracing::{info, error};

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
    blockchain: BlockchainSender,
}

impl Gateway {
    async fn new(mqtt_broker: &str, mqtt_port: u16, blockchain_endpoint: &str, encryption_key: &str) -> Result<Self> {
        let mut mqttoptions = MqttOptions::new("bae-gateway", mqtt_broker, mqtt_port);
        mqttoptions.set_keep_alive(std::time::Duration::from_secs(30));
        let (mqtt_client, mqtt_eventloop) = AsyncClient::new(mqttoptions, 10);
        let crypto = CryptoHandler::new(encryption_key)?;
        let blockchain = BlockchainSender::new(blockchain_endpoint).await?;
        Ok(Self { mqtt_client, mqtt_eventloop, crypto, blockchain })
    }

    async fn start(&mut self) -> Result<()> {
        self.mqtt_client.subscribe("bae/sensors/+/data", QoS::AtLeastOnce).await?;
        info!("✅ Gateway subscribed to MQTT topics");
        info!("🔗 Connected to Paseo Testnet");
        
        loop {
            match self.mqtt_eventloop.poll().await {
                Ok(Event::Incoming(Packet::Publish(publish))) => {
                    if let Err(e) = self.handle_sensor_data(&publish.payload).await {
                        error!("❌ Error: {}", e);
                    }
                }
                Ok(_) => {}
                Err(e) => {
                    error!("MQTT error: {}", e);
                    tokio::time::sleep(tokio::time::Duration::from_secs(5)).await;
                }
            }
        }
    }

    async fn handle_sensor_data(&mut self, payload: &[u8]) -> Result<()> {
        let reading: SensorReading = serde_json::from_slice(payload)?;
        info!("📥 Received from {}: T={:.1}°C, H={:.1}%", reading.device_id, reading.temperature, reading.humidity);
        
        let encrypted = self.crypto.encrypt(&reading)?;
        info!("🔒 Data encrypted");
        
        let signature = self.crypto.sign(&encrypted)?;
        info!("✍️  Data signed");
        
        let tx_hash = self.blockchain.submit_sensor_data(
            &reading.device_id, &encrypted.ciphertext, &encrypted.nonce, &signature, reading.timestamp
        ).await?;
        
        info!("✅ Submitted to Paseo Testnet: {}", tx_hash);
        Ok(())
    }
}

#[tokio::main]
async fn main() -> Result<()> {
    tracing_subscriber::fmt().with_env_filter(tracing_subscriber::EnvFilter::from_default_env()).init();
    info!("🚀 Starting Bae Gateway");
    
    let mqtt_broker = std::env::var("MQTT_BROKER").unwrap_or_else(|_| "localhost".to_string());
    let mqtt_port = std::env::var("MQTT_PORT").unwrap_or_else(|_| "1883".to_string()).parse()?;
    let blockchain_endpoint = std::env::var("BLOCKCHAIN_ENDPOINT").unwrap_or_else(|_| "wss://paseo-rpc.polkadot.io".to_string());
    let encryption_key = std::env::var("ENCRYPTION_KEY").unwrap_or_else(|_| "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef".to_string());
    
    let mut gateway = Gateway::new(&mqtt_broker, mqtt_port, &blockchain_endpoint, &encryption_key).await?;
    gateway.start().await
}
