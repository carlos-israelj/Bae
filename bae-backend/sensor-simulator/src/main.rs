use anyhow::Result;
use rand::Rng;
use rumqttc::{AsyncClient, Event, MqttOptions, Packet, QoS};
use serde::{Serialize, Deserialize};
use std::time::{SystemTime, UNIX_EPOCH};
use tracing::{info, error, warn};

#[derive(Debug, Serialize, Deserialize)]
struct SensorReading {
    device_id: String,
    temperature: f32,
    humidity: f32,
    timestamp: u64,
}

struct SensorSimulator {
    device_id: String,
    client: AsyncClient,
    connected: std::sync::Arc<std::sync::atomic::AtomicBool>,
}

impl SensorSimulator {
    fn new(device_id: String, mqtt_broker: &str, mqtt_port: u16) -> Result<Self> {
        let mut mqttoptions = MqttOptions::new(
            format!("sensor-{}", device_id),
            mqtt_broker,
            mqtt_port,
        );
        mqttoptions.set_keep_alive(std::time::Duration::from_secs(30));
        mqttoptions.set_clean_session(true); // Importante para evitar mensajes antiguos

        let (client, mut eventloop) = AsyncClient::new(mqttoptions, 10);
        let connected = std::sync::Arc::new(std::sync::atomic::AtomicBool::new(false));
        let connected_clone = connected.clone();

        // Mejorado: manejo de conexión más robusto
        tokio::spawn(async move {
            loop {
                match eventloop.poll().await {
                    Ok(Event::Incoming(Packet::ConnAck(_))) => {
                        info!("📡 Connected to MQTT broker");
                        connected_clone.store(true, std::sync::atomic::Ordering::Relaxed);
                    }
                    Ok(Event::Incoming(Packet::Disconnect)) => {
                        warn!("⚠️  Disconnected from MQTT broker");
                        connected_clone.store(false, std::sync::atomic::Ordering::Relaxed);
                    }
                    Ok(_) => {}
                    Err(e) => {
                        error!("❌ MQTT error: {}", e);
                        connected_clone.store(false, std::sync::atomic::Ordering::Relaxed);
                        tokio::time::sleep(tokio::time::Duration::from_secs(5)).await;
                    }
                }
            }
        });

        Ok(Self { 
            device_id, 
            client,
            connected,
        })
    }

    fn generate_reading(&self) -> SensorReading {
        let mut rng = rand::thread_rng();
        let alert_chance = rng.gen_range(0.0..1.0);
        
        // Mejorado: Rangos más realistas y alertas claras
        let (temperature, alert_type) = if alert_chance < 0.10 {
            // 10% - Alerta de frío extremo
            (rng.gen_range(15.0..17.0), Some("COLD"))
        } else if alert_chance < 0.15 {
            // 5% - Alerta de calor extremo
            (rng.gen_range(29.0..31.0), Some("HOT"))
        } else {
            // 85% - Temperatura normal
            (23.0 + rng.gen_range(-2.0..2.0), None)
        };

        // Humedad con límites realistas
        let humidity = (55.0_f32 + rng.gen_range(-10.0..10.0)).clamp(20.0, 80.0);
        
        let timestamp = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs();

        // Log de alertas
        if let Some(alert) = alert_type {
            warn!(
                "🚨 ALERT [{}] - Device {}: T={:.1}°C (threshold exceeded)",
                alert, self.device_id, temperature
            );
        }

        SensorReading {
            device_id: self.device_id.clone(),
            temperature,
            humidity,
            timestamp,
        }
    }

    async fn publish_reading(&mut self) -> Result<()> {
        // Verificar conexión antes de publicar
        if !self.connected.load(std::sync::atomic::Ordering::Relaxed) {
            warn!("⚠️  Not connected to MQTT broker, skipping publish");
            return Ok(());
        }

        let reading = self.generate_reading();
        
        info!(
            "📊 Device {}: T={:.1}°C, H={:.1}%",
            reading.device_id, reading.temperature, reading.humidity
        );

        let topic = format!("bae/sensors/{}/data", self.device_id);
        let payload = serde_json::to_vec(&reading)?;

        // Mejorado: timeout para publicación
        match tokio::time::timeout(
            tokio::time::Duration::from_secs(5),
            self.client.publish(topic, QoS::AtLeastOnce, false, payload)
        ).await {
            Ok(Ok(_)) => {
                info!("✅ Published successfully");
                Ok(())
            }
            Ok(Err(e)) => {
                error!("❌ Failed to publish: {}", e);
                Err(e.into())
            }
            Err(_) => {
                error!("❌ Publish timeout");
                Err(anyhow::anyhow!("Publish timeout"))
            }
        }
    }

    async fn run(&mut self, interval_secs: u64) -> Result<()> {
        info!("🚀 Starting sensor simulator for device: {}", self.device_id);
        info!("📡 Publishing every {} seconds", interval_secs);
        info!("🌡️  Temperature ranges:");
        info!("   • Normal: 21-25°C (85%)");
        info!("   • Cold Alert: 15-17°C (10%)");
        info!("   • Hot Alert: 29-31°C (5%)");
        
        // Esperar conexión inicial
        info!("⏳ Waiting for MQTT connection...");
        for _ in 0..30 {
            if self.connected.load(std::sync::atomic::Ordering::Relaxed) {
                break;
            }
            tokio::time::sleep(tokio::time::Duration::from_secs(1)).await;
        }

        if !self.connected.load(std::sync::atomic::Ordering::Relaxed) {
            error!("❌ Failed to connect to MQTT broker after 30 seconds");
            return Err(anyhow::anyhow!("MQTT connection timeout"));
        }

        info!("✅ Connected! Starting to publish data...");

        let mut publish_count = 0u64;
        let mut error_count = 0u64;

        loop {
            match self.publish_reading().await {
                Ok(_) => {
                    publish_count += 1;
                    if publish_count % 10 == 0 {
                        info!("📈 Stats: {} messages published, {} errors", publish_count, error_count);
                    }
                }
                Err(e) => {
                    error_count += 1;
                    error!("❌ Error publishing: {}", e);
                }
            }
            
            tokio::time::sleep(tokio::time::Duration::from_secs(interval_secs)).await;
        }
    }
}

#[tokio::main]
async fn main() -> Result<()> {
    // Cargar .env si existe
    dotenv::dotenv().ok();
    
    // Inicializar logging
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::from_default_env()
                .add_directive("sensor_simulator=info".parse()?)
        )
        .init();

    // Leer configuración
    let mqtt_broker = std::env::var("MQTT_BROKER")
        .unwrap_or_else(|_| "broker.hivemq.com".to_string());
    let mqtt_port = std::env::var("MQTT_PORT")
        .unwrap_or_else(|_| "1883".to_string())
        .parse()
        .unwrap_or(1883);
    let device_id = std::env::var("DEVICE_ID")
        .unwrap_or_else(|_| "ESP32-001".to_string());
    let interval = std::env::var("INTERVAL_SECS")
        .unwrap_or_else(|_| "30".to_string())
        .parse()
        .unwrap_or(30);

    info!("⚙️  Configuration:");
    info!("   MQTT Broker: {}:{}", mqtt_broker, mqtt_port);
    info!("   Device ID: {}", device_id);
    info!("   Interval: {}s", interval);
    info!("");

    let mut simulator = SensorSimulator::new(device_id, &mqtt_broker, mqtt_port)?;
    simulator.run(interval).await
}