use anyhow::Result;

#[derive(Clone, Debug)]
pub struct Config {
    pub port: u16,
    pub blockchain_endpoint: String,
    pub encryption_key: String,
}

impl Config {
    pub fn from_env() -> Result<Self> {
        Ok(Self {
            port: std::env::var("PORT").unwrap_or_else(|_| "3000".to_string()).parse()?,
            blockchain_endpoint: std::env::var("BLOCKCHAIN_ENDPOINT").unwrap_or_else(|_| "wss://paseo-rpc.polkadot.io".to_string()),
            encryption_key: std::env::var("ENCRYPTION_KEY").unwrap_or_else(|_| "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef".to_string()),
        })
    }
}
