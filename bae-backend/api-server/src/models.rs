use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SensorReading {
    pub device_id: String,
    pub temperature: f32,
    pub humidity: f32,
    pub timestamp: u64,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub block_number: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Alert {
    pub id: String,
    pub device_id: String,
    pub alert_type: String,
    pub message: String,
    pub timestamp: u64,
    pub severity: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct BabyProfile {
    pub id: String,
    pub name: String,
    pub birth_date: String,
    pub linked_devices: Vec<String>,
    pub created_at: u64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateBabyRequest {
    pub name: String,
    pub birth_date: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AnalyticsSummary {
    pub device_id: String,
    pub period: String,
    pub avg_temperature: f32,
    pub min_temperature: f32,
    pub max_temperature: f32,
    pub avg_humidity: f32,
    pub total_readings: u32,
    pub comfort_percentage: f32,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TrendData {
    pub timestamp: u64,
    pub temperature: f32,
    pub humidity: f32,
    pub status: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ApiResponse<T> {
    pub success: bool,
    pub data: Option<T>,
    pub error: Option<String>,
}

impl<T> ApiResponse<T> {
    pub fn success(data: T) -> Self {
        Self { success: true, data: Some(data), error: None }
    }
}

#[derive(Debug, Serialize)]
pub struct HealthResponse {
    pub status: String,
    pub version: String,
    pub blockchain_connected: bool,
}
