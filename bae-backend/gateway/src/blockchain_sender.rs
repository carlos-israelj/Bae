use anyhow::{Result, anyhow};
use ethers::prelude::*;
use std::sync::Arc;
use tracing::{info, warn};

abigen!(
    BaeSensorRegistry,
    r#"[
        function submitSensorData(string memory deviceId, bytes memory ciphertext, bytes memory nonce, bytes memory signature, uint256 timestamp) external
        function getReadingCount() external view returns (uint256)
        function totalReadings() external view returns (uint256)
        event SensorDataSubmitted(string indexed deviceId, uint256 timestamp, uint256 blockNumber, uint256 index)
    ]"#
);

pub struct BlockchainSender {
    contract: BaeSensorRegistry<SignerMiddleware<Provider<Http>, LocalWallet>>,
    chain_id: u64,
}

impl BlockchainSender {
    pub async fn new(rpc_url: &str, contract_address: &str, private_key: &str) -> Result<Self> {
        info!("🔗 Connecting to Paseo Hub...");
        
        // Conectar al provider con timeout
        let provider = Provider::<Http>::try_from(rpc_url)
            .map_err(|e| anyhow!("Failed to connect to RPC: {}", e))?;
        
        // Verificar conexión obteniendo chain ID con timeout
        let chain_id = tokio::time::timeout(
            tokio::time::Duration::from_secs(10),
            provider.get_chainid()
        )
        .await
        .map_err(|_| anyhow!("Timeout connecting to RPC"))?
        .map_err(|e| anyhow!("Failed to get chain ID: {}", e))?;
        
        info!("✅ Connected to chain ID: {}", chain_id);
        
        // Configurar wallet
        let wallet: LocalWallet = private_key
            .parse()
            .map_err(|e| anyhow!("Invalid private key format: {:?}", e))?;
        let wallet = wallet.with_chain_id(chain_id.as_u64());
        
        info!("👛 Wallet address: {:?}", wallet.address());
        
        // Verificar balance
        let balance = provider.get_balance(wallet.address(), None).await
            .map_err(|e| anyhow!("Failed to get balance: {}", e))?;
        
        let balance_eth = ethers::utils::format_ether(balance);
        info!("💰 Wallet balance: {} PAS", balance_eth);
        
        if balance.is_zero() {
            warn!("⚠️  WARNING: Wallet has zero balance. Transactions will fail!");
            warn!("⚠️  Get test tokens from: https://faucet.polkadot.io/paseo");
        }
        
        // Crear cliente con middleware
        let client = SignerMiddleware::new(provider, wallet);
        let client = Arc::new(client);
        
        // Parsear dirección del contrato
        let address: Address = contract_address
            .parse()
            .map_err(|e| anyhow!("Invalid contract address format: {:?}", e))?;
        
        info!("📄 Contract address: {:?}", address);
        
        // Crear instancia del contrato
        let contract = BaeSensorRegistry::new(address, client);
        
        // Verificar que el contrato existe
        match contract.total_readings().call().await {
            Ok(count) => {
                info!("✅ Contract verified! Current readings: {}", count);
            }
            Err(e) => {
                warn!("⚠️  Could not verify contract (might not be deployed): {}", e);
            }
        }
        
        Ok(Self { 
            contract,
            chain_id: chain_id.as_u64(),
        })
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
        info!("   Device: {}", device_id);
        info!("   Data size: {} bytes", ciphertext.len());
        
        // Preparar los parámetros
        let device_id_owned = device_id.to_string();
        let ciphertext_bytes = Bytes::from(ciphertext.to_vec());
        let nonce_bytes = Bytes::from(nonce.to_vec());
        let signature_bytes = Bytes::from(signature.to_vec());
        let timestamp_u256 = U256::from(timestamp);
        
        // Crear call
        let call = self.contract.submit_sensor_data(
            device_id_owned,
            ciphertext_bytes,
            nonce_bytes,
            signature_bytes,
            timestamp_u256,
        );
        
        // Estimar gas antes de enviar
        match call.estimate_gas().await {
            Ok(gas_estimate) => {
                info!("⛽ Estimated gas: {}", gas_estimate);
            }
            Err(e) => {
                warn!("⚠️  Could not estimate gas: {}. Proceeding anyway...", e);
            }
        }
        
        // Configurar gas price (opcional, usa el default del provider)
        // let call = call.gas_price(U256::from(1_000_000_000u64)); // 1 Gwei
        
        // Enviar transacción
        let pending_tx = call
            .send()
            .await
            .map_err(|e| anyhow!("Failed to send transaction: {}", e))?;
        
        let tx_hash = format!("{:?}", pending_tx.tx_hash());
        info!("⏳ TX sent: {}", tx_hash);
        info!("🔗 Explorer: https://blockscout-passet-hub.parity-testnet.parity.io/tx/{}", tx_hash);
        
        // Esperar confirmación con timeout
        info!("⏳ Waiting for confirmation (max 120s)...");
        
        match tokio::time::timeout(
            tokio::time::Duration::from_secs(120),
            pending_tx
        ).await {
            Ok(Ok(Some(receipt))) => {
                let confirmed_hash = format!("{:?}", receipt.transaction_hash);
                let block_number = receipt.block_number.unwrap_or_default();
                let gas_used = receipt.gas_used.unwrap_or_default();
                
                info!("✅ Confirmed!");
                info!("   Block: {}", block_number);
                info!("   Gas used: {}", gas_used);
                info!("   Status: {:?}", receipt.status);
                
                // Verificar status de la transacción
                if receipt.status == Some(U64::from(0)) {
                    return Err(anyhow!("Transaction failed on-chain"));
                }
                
                Ok(confirmed_hash)
            }
            Ok(Ok(None)) => {
                warn!("⚠️  Transaction pending (no receipt)");
                Ok(tx_hash)
            }
            Ok(Err(e)) => {
                Err(anyhow!("Transaction failed: {}", e))
            }
            Err(_) => {
                warn!("⚠️  Transaction timeout (still might be pending)");
                Ok(tx_hash)
            }
        }
    }

    #[allow(dead_code)]
    pub async fn get_reading_count(&self) -> Result<u64> {
        let count = self.contract
            .get_reading_count()
            .call()
            .await
            .map_err(|e| anyhow!("Failed to get reading count: {}", e))?;
        
        Ok(count.as_u64())
    }
}