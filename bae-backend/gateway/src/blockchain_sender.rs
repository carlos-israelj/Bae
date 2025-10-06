use anyhow::Result;
use subxt::{OnlineClient, PolkadotConfig, tx::PairSigner};
use sp_keyring::AccountKeyring;
use sp_core::sr25519::Pair;
use tracing::info;

#[subxt::subxt(runtime_metadata_path = "../metadata/paseo_metadata.scale")]
pub mod paseo {}

pub struct BlockchainSender {
    client: OnlineClient<PolkadotConfig>,
    signer: PairSigner<PolkadotConfig, Pair>,
}

impl BlockchainSender {
    pub async fn new(endpoint: &str) -> Result<Self> {
        info!("🔗 Connecting to Paseo Testnet: {}", endpoint);
        let client = OnlineClient::<PolkadotConfig>::from_url(endpoint).await?;
        let signer = PairSigner::new(AccountKeyring::Alice.pair());
        info!("✅ Connected to Paseo Testnet");
        Ok(Self { client, signer })
    }

    pub async fn submit_sensor_data(&self, device_id: &str, ciphertext: &[u8], nonce: &[u8], signature: &[u8], timestamp: u64) -> Result<String> {
        let payload = serde_json::json!({
            "device_id": device_id,
            "ciphertext": hex::encode(ciphertext),
            "nonce": hex::encode(nonce),
            "signature": hex::encode(signature),
            "timestamp": timestamp,
            "app": "bae-health"
        });
        
        let remark = payload.to_string().into_bytes();
        let tx = paseo::tx().system().remark_with_event(remark);
        let result = self.client.tx().sign_and_submit_then_watch_default(&tx, &self.signer).await?.wait_for_finalized_success().await?;
        Ok(format!("0x{}", hex::encode(result.extrinsic_hash())))
    }
}
