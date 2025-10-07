use anyhow::{Result, anyhow};
use ethers::prelude::*;
use std::sync::Arc;
use tracing::info;

abigen!(
    BaeSensorRegistry,
    r#"[
        function submitSensorData(string memory deviceId, bytes memory ciphertext, bytes memory nonce, bytes memory signature, uint256 timestamp) external
        event SensorDataSubmitted(string indexed deviceId, uint256 timestamp, uint256 blockNumber)
    ]"#
);

pub struct BlockchainSender {
    contract: BaeSensorRegistry<SignerMiddleware<Provider<Http>, LocalWallet>>,
}

impl BlockchainSender {
    pub async fn new(rpc_url: &str, contract_address: &str, private_key: &str) -> Result<Self> {
        info!("🔗 Connecting to Paseo Hub...");
        
        let provider = Provider::<Http>::try_from(rpc_url)?;
        let chain_id = provider.get_chainid().await?;
        
        let wallet: LocalWallet = private_key.parse()
            .map_err(|e| anyhow!("Invalid private key: {:?}", e))?;
        let wallet = wallet.with_chain_id(chain_id.as_u64());
        
        let client = SignerMiddleware::new(provider, wallet);
        let client = Arc::new(client);
        
        let address: Address = contract_address.parse()
            .map_err(|e| anyhow!("Invalid contract address: {:?}", e))?;
        let contract = BaeSensorRegistry::new(address, client);
        
        info!("✅ Connected (Chain ID: {})", chain_id);
        Ok(Self { contract })
    }

    pub async fn submit_sensor_data(
        &self,
        device_id: &str,
        ciphertext: &[u8],
        nonce: &[u8],
        signature: &[u8],
        timestamp: u64,
    ) -> Result<String> {
        info!("📤 Submitting to contract...");
        
        // Preparar los parámetros
        let device_id_owned = device_id.to_string();
        let ciphertext_bytes = Bytes::from(ciphertext.to_vec());
        let nonce_bytes = Bytes::from(nonce.to_vec());
        let signature_bytes = Bytes::from(signature.to_vec());
        let timestamp_u256 = U256::from(timestamp);
        
        // Crear y enviar la transacción
        let call = self.contract.submit_sensor_data(
            device_id_owned,
            ciphertext_bytes,
            nonce_bytes,
            signature_bytes,
            timestamp_u256,
        );
        
        let pending_tx = call.send().await?;
        let tx_hash = format!("0x{:x}", pending_tx.tx_hash());
        
        info!("⏳ TX sent: {}", tx_hash);
        info!("⏳ Waiting for confirmation...");
        
        // Esperar confirmación
        match pending_tx.await? {
            Some(receipt) => {
                let confirmed_hash = format!("0x{:x}", receipt.transaction_hash);
                info!("✅ Confirmed in block: {}", receipt.block_number.unwrap_or_default());
                Ok(confirmed_hash)
            }
            None => {
                info!("⚠️  Transaction pending");
                Ok(tx_hash)
            }
        }
    }
}
