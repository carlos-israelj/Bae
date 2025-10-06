use axum::{extract::{Path, Query, State}, http::StatusCode, Json};
use serde::Deserialize;
use crate::{AppState, models::{ApiResponse, AnalyticsSummary, TrendData}};

#[derive(Deserialize)]
pub struct AnalyticsQuery { pub period: Option<String> }

pub async fn get_summary(State(_state): State<AppState>, Path(device_id): Path<String>, Query(_params): Query<AnalyticsQuery>) -> Json<ApiResponse<AnalyticsSummary>> {
    let summary = AnalyticsSummary {
        device_id,
        period: "24h".to_string(),
        avg_temperature: 23.5,
        min_temperature: 20.0,
        max_temperature: 27.0,
        avg_humidity: 55.0,
        total_readings: 100,
        comfort_percentage: 85.0,
    };
    Json(ApiResponse::success(summary))
}

pub async fn get_trends(State(_state): State<AppState>, Path(_device_id): Path<String>, Query(_params): Query<AnalyticsQuery>) -> Json<ApiResponse<Vec<TrendData>>> {
    Json(ApiResponse::success(vec![]))
}
