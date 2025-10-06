use axum::{Router, routing::{get, post}};
use tower_http::cors::{CorsLayer, Any};
use tower_http::trace::TraceLayer;
use tracing::info;
use std::net::SocketAddr;
use std::sync::Arc;

mod config;
mod models;
mod blockchain;
mod handlers;

use config::Config;
use blockchain::BlockchainClient;

#[derive(Clone)]
pub struct AppState {
    pub blockchain: Arc<BlockchainClient>,
    pub config: Arc<Config>,
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    tracing_subscriber::fmt().with_env_filter(tracing_subscriber::EnvFilter::from_default_env()).init();
    info!("🚀 Starting Bae API Server");
    
    let config = Config::from_env()?;
    let blockchain = BlockchainClient::new(&config.blockchain_endpoint).await?;
    let state = AppState { blockchain: Arc::new(blockchain), config: Arc::new(config.clone()) };
    
    let app = Router::new()
        .route("/health", get(handlers::health::health_check))
        .route("/api/v1/sensors/:device_id/latest", get(handlers::sensors::get_latest))
        .route("/api/v1/sensors/:device_id", get(handlers::sensors::get_history))
        .route("/api/v1/sensors/:device_id/alerts", get(handlers::sensors::get_alerts))
        .route("/api/v1/babies", post(handlers::babies::create_profile))
        .route("/api/v1/babies/:baby_id", get(handlers::babies::get_profile))
        .route("/api/v1/analytics/:device_id/summary", get(handlers::analytics::get_summary))
        .route("/api/v1/analytics/:device_id/trends", get(handlers::analytics::get_trends))
        .with_state(state)
        .layer(CorsLayer::new().allow_origin(Any).allow_methods(Any).allow_headers(Any))
        .layer(TraceLayer::new_for_http());
    
    let addr = SocketAddr::from(([0, 0, 0, 0], config.port));
    info!("🌐 Server listening on {}", addr);
    
    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;
    Ok(())
}
