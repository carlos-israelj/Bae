use axum::{extract::State, Json};
use crate::{AppState, models::{ApiResponse, HealthResponse}};

pub async fn health_check(State(state): State<AppState>) -> Json<ApiResponse<HealthResponse>> {
    let response = HealthResponse {
        status: "ok".to_string(),
        version: "0.1.0".to_string(),
        blockchain_connected: state.blockchain.is_connected().await,
    };
    Json(ApiResponse::success(response))
}
