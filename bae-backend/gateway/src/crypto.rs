use aes_gcm::{aead::{Aead, KeyInit, OsRng}, Aes256Gcm, Nonce};
use anyhow::{Result, anyhow};
use serde::{Serialize, Deserialize};
use sha2::{Sha256, Digest};
use rand::RngCore;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EncryptedPayload {
    pub ciphertext: Vec<u8>,
    pub nonce: Vec<u8>,
}

pub struct CryptoHandler {
    cipher: Aes256Gcm,
}

impl CryptoHandler {
    pub fn new(key_hex: &str) -> Result<Self> {
        let key_bytes = hex::decode(key_hex).map_err(|e| anyhow!("Invalid key: {}", e))?;
        if key_bytes.len() != 32 {
            return Err(anyhow!("Key must be 32 bytes"));
        }
        let key = aes_gcm::Key::<Aes256Gcm>::from_slice(&key_bytes);
        Ok(Self { cipher: Aes256Gcm::new(key) })
    }

    pub fn encrypt<T: Serialize>(&self, data: &T) -> Result<EncryptedPayload> {
        let plaintext = serde_json::to_vec(data)?;
        let mut nonce_bytes = [0u8; 12];
        OsRng.fill_bytes(&mut nonce_bytes);
        let nonce = Nonce::from_slice(&nonce_bytes);
        let ciphertext = self.cipher.encrypt(nonce, plaintext.as_ref())
            .map_err(|e| anyhow!("Encryption failed: {}", e))?;
        Ok(EncryptedPayload { ciphertext, nonce: nonce_bytes.to_vec() })
    }

    pub fn sign(&self, payload: &EncryptedPayload) -> Result<Vec<u8>> {
        let mut hasher = Sha256::new();
        hasher.update(&payload.ciphertext);
        hasher.update(&payload.nonce);
        Ok(hasher.finalize().to_vec())
    }
}
