use axum::{extract::{Path, State}, http::StatusCode, Json};
use crate::{AppState, models::{ApiResponse, BabyProfile, CreateBabyRequest}};

pub async fn create_profile(State(_state): State<AppState>, Json(request): Json<CreateBabyRequest>) -> Result<Json<ApiResponse<BabyProfile>>, StatusCode> {
    let profile = BabyProfile {
        id: uuid::Uuid::new_v4().to_string(),
        name: request.name,
        birth_date: request.birth_date,
        linked_devices: vec![],
        created_at: chrono::Utc::now().timestamp() as u64,
    };
    Ok(Json(ApiResponse::success(profile)))
}

pub async fn get_profile(State(_state): State<AppState>, Path(baby_id): Path<String>) -> Json<ApiResponse<BabyProfile>> {
    let profile = BabyProfile {
        id: baby_id,
        name: "Baby Demo".to_string(),
        birth_date: "2024-01-01".to_string(),
        linked_devices: vec![],
        created_at: chrono::Utc::now().timestamp() as u64,
    };
    Json(ApiResponse::success(profile))
}
