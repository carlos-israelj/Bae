use anyhow::Result;
use subxt::{OnlineClient, PolkadotConfig};
use tracing::info;
use crate::models::SensorReading;

pub struct BlockchainClient {
    _client: OnlineClient<PolkadotConfig>,
}

impl BlockchainClient {
    pub async fn new(endpoint: &str) -> Result<Self> {
        info!("Connecting to: {}", endpoint);
        let client = OnlineClient::<PolkadotConfig>::from_url(endpoint).await?;
        Ok(Self { _client: client })
    }

    pub async fn get_sensor_data(&self, device_id: &str, limit: u32) -> Result<Vec<SensorReading>> {
        // Mock data para MVP
        let reading = SensorReading {
            device_id: device_id.to_string(),
            temperature: 23.5,
            humidity: 55.0,
            timestamp: chrono::Utc::now().timestamp() as u64,
            block_number: Some("mock".to_string()),
        };
        Ok(vec![reading; limit as usize])
    }

    pub async fn is_connected(&self) -> bool { true }
}
