use axum::{extract::{Path, Query, State}, http::StatusCode, Json};
use serde::Deserialize;
use crate::{AppState, models::{ApiResponse, SensorReading, Alert}};

#[derive(Deserialize)]
pub struct QueryParams { pub limit: Option<u32> }

pub async fn get_latest(State(state): State<AppState>, Path(device_id): Path<String>) -> Result<Json<ApiResponse<SensorReading>>, StatusCode> {
    match state.blockchain.get_sensor_data(&device_id, 1).await {
        Ok(mut r) if !r.is_empty() => Ok(Json(ApiResponse::success(r.remove(0)))),
        _ => Err(StatusCode::NOT_FOUND)
    }
}

pub async fn get_history(State(state): State<AppState>, Path(device_id): Path<String>, Query(params): Query<QueryParams>) -> Result<Json<ApiResponse<Vec<SensorReading>>>, StatusCode> {
    let limit = params.limit.unwrap_or(10).min(100);
    match state.blockchain.get_sensor_data(&device_id, limit).await {
        Ok(r) => Ok(Json(ApiResponse::success(r))),
        _ => Err(StatusCode::INTERNAL_SERVER_ERROR)
    }
}

pub async fn get_alerts(State(_state): State<AppState>, Path(_device_id): Path<String>, Query(_params): Query<QueryParams>) -> Json<ApiResponse<Vec<Alert>>> {
    Json(ApiResponse::success(vec![]))
}
