use anyhow::Result;
use rand::Rng;
use rumqttc::{AsyncClient, Event, MqttOptions, Packet, QoS};
use serde::{Serialize, Deserialize};
use std::time::{SystemTime, UNIX_EPOCH};
use tracing::{info, error};

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
}

impl SensorSimulator {
    fn new(device_id: String, mqtt_broker: &str, mqtt_port: u16) -> Result<Self> {
        let mut mqttoptions = MqttOptions::new(
            format!("sensor-{}", device_id),
            mqtt_broker,
            mqtt_port,
        );
        mqttoptions.set_keep_alive(std::time::Duration::from_secs(30));

        let (client, mut eventloop) = AsyncClient::new(mqttoptions, 10);

        tokio::spawn(async move {
            loop {
                match eventloop.poll().await {
                    Ok(Event::Incoming(Packet::ConnAck(_))) => {
                        info!("📡 Connected to MQTT broker");
                    }
                    Ok(_) => {}
                    Err(e) => {
                        error!("MQTT error: {}", e);
                        tokio::time::sleep(tokio::time::Duration::from_secs(5)).await;
                    }
                }
            }
        });

        Ok(Self { device_id, client })
    }

    fn generate_reading(&self) -> SensorReading {
        let mut rng = rand::thread_rng();
        let alert_chance = rng.gen_range(0.0..1.0);
        
        let temperature = if alert_chance < 0.10 {
            rng.gen_range(15.0..17.0)
        } else if alert_chance < 0.15 {
            rng.gen_range(29.0..31.0)
        } else {
            23.0 + rng.gen_range(-2.0..2.0)
        };

        let humidity = 55.0 + rng.gen_range(-10.0..10.0);
        let timestamp = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs();

        SensorReading {
            device_id: self.device_id.clone(),
            temperature,
            humidity,
            timestamp,
        }
    }

    async fn publish_reading(&mut self) -> Result<()> {
        let reading = self.generate_reading();
        
        info!(
            "📊 Device {}: T={:.1}°C, H={:.1}%",
            reading.device_id, reading.temperature, reading.humidity
        );

        let topic = format!("bae/sensors/{}/data", self.device_id);
        let payload = serde_json::to_vec(&reading)?;

        self.client.publish(topic, QoS::AtLeastOnce, false, payload).await?;
        Ok(())
    }

    async fn run(&mut self, interval_secs: u64) -> Result<()> {
        info!("🚀 Starting sensor simulator for device: {}", self.device_id);
        info!("📡 Publishing every {} seconds", interval_secs);

        loop {
            if let Err(e) = self.publish_reading().await {
                error!("❌ Error publishing: {}", e);
            }
            tokio::time::sleep(tokio::time::Duration::from_secs(interval_secs)).await;
        }
    }
}

#[tokio::main]
async fn main() -> Result<()> {
    // Cargar .env si existe
    dotenv::dotenv().ok();
    
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::from_default_env()
                .add_directive("sensor_simulator=info".parse()?)
        )
        .init();

    let mqtt_broker = std::env::var("MQTT_BROKER")
        .unwrap_or_else(|_| "broker.hivemq.com".to_string());
    let mqtt_port = std::env::var("MQTT_PORT")
        .unwrap_or_else(|_| "1883".to_string()).parse()?;
    let device_id = std::env::var("DEVICE_ID")
        .unwrap_or_else(|_| "ESP32-001".to_string());
    let interval = std::env::var("INTERVAL_SECS")
        .unwrap_or_else(|_| "30".to_string()).parse()?;

    info!("⚙️  Configuration:");
    info!("   MQTT Broker: {}:{}", mqtt_broker, mqtt_port);
    info!("   Device ID: {}", device_id);
    info!("   Interval: {}s", interval);

    let mut simulator = SensorSimulator::new(device_id, &mqtt_broker, mqtt_port)?;
    simulator.run(interval).await
}
