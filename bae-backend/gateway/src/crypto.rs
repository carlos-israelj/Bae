use aes_gcm::{
    aead::{Aead, KeyInit, OsRng},
    Aes256Gcm, Nonce,
};
use anyhow::{Result, anyhow};
use serde::{Serialize, Deserialize};
use sha2::{Sha256, Digest};
use rand::RngCore;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EncryptedPayload {
    pub ciphertext: Vec<u8>,
    pub nonce: Vec<u8>,
}

#[derive(Clone)]
pub struct CryptoHandler {
    cipher: Aes256Gcm,
}

impl CryptoHandler {
    /// Crea un nuevo handler de criptografía con una clave en formato hexadecimal
    /// La clave debe ser de 64 caracteres hex (32 bytes)
    pub fn new(key_hex: &str) -> Result<Self> {
        // Validar longitud
        if key_hex.len() != 64 {
            return Err(anyhow!(
                "Key must be 64 hex characters (32 bytes), got {} characters", 
                key_hex.len()
            ));
        }
        
        // Decodificar de hex a bytes
        let key_bytes = hex::decode(key_hex)
            .map_err(|e| anyhow!("Invalid hex key: {}. Key must contain only 0-9, a-f characters", e))?;
        
        // Verificar longitud de bytes
        if key_bytes.len() != 32 {
            return Err(anyhow!("Key must be exactly 32 bytes, got {}", key_bytes.len()));
        }
        
        // Crear cipher
        let key = aes_gcm::Key::<Aes256Gcm>::from_slice(&key_bytes);
        let cipher = Aes256Gcm::new(key);
        
        Ok(Self { cipher })
    }

    /// Encripta datos serializables usando AES-256-GCM
    pub fn encrypt<T: Serialize>(&self, data: &T) -> Result<EncryptedPayload> {
        // Serializar a JSON
        let plaintext = serde_json::to_vec(data)
            .map_err(|e| anyhow!("Serialization failed: {}", e))?;
        
        // Generar nonce aleatorio (12 bytes para GCM)
        let mut nonce_bytes = [0u8; 12];
        OsRng.fill_bytes(&mut nonce_bytes);
        let nonce = Nonce::from_slice(&nonce_bytes);
        
        // Encriptar
        let ciphertext = self.cipher
            .encrypt(nonce, plaintext.as_ref())
            .map_err(|e| anyhow!("Encryption failed: {}", e))?;
        
        Ok(EncryptedPayload {
            ciphertext,
            nonce: nonce_bytes.to_vec(),
        })
    }

    /// Desencripta datos (útil para verificación local)
    #[allow(dead_code)]
    pub fn decrypt<T: for<'de> Deserialize<'de>>(&self, payload: &EncryptedPayload) -> Result<T> {
        // Validar nonce
        if payload.nonce.len() != 12 {
            return Err(anyhow!("Invalid nonce length: expected 12 bytes, got {}", payload.nonce.len()));
        }
        
        let nonce = Nonce::from_slice(&payload.nonce);
        
        // Desencriptar
        let plaintext = self.cipher
            .decrypt(nonce, payload.ciphertext.as_ref())
            .map_err(|e| anyhow!("Decryption failed: {}", e))?;
        
        // Deserializar
        let data = serde_json::from_slice(&plaintext)
            .map_err(|e| anyhow!("Deserialization failed: {}", e))?;
        
        Ok(data)
    }

    /// Genera una firma SHA-256 del payload encriptado
    /// Esto ayuda a verificar integridad sin desencriptar
    pub fn sign(&self, payload: &EncryptedPayload) -> Result<Vec<u8>> {
        let mut hasher = Sha256::new();
        
        // Hash del ciphertext
        hasher.update(&payload.ciphertext);
        
        // Hash del nonce
        hasher.update(&payload.nonce);
        
        // Obtener digest final
        let signature = hasher.finalize().to_vec();
        
        Ok(signature)
    }

    /// Verifica la firma de un payload
    #[allow(dead_code)]
    pub fn verify_signature(&self, payload: &EncryptedPayload, signature: &[u8]) -> Result<bool> {
        let computed_signature = self.sign(payload)?;
        Ok(computed_signature == signature)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde::{Deserialize, Serialize};

    #[derive(Debug, Serialize, Deserialize, PartialEq)]
    struct TestData {
        message: String,
        value: u64,
    }

    #[test]
    fn test_crypto_roundtrip() {
        let key = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
        let crypto = CryptoHandler::new(key).unwrap();

        let original = TestData {
            message: "Hello, World!".to_string(),
            value: 42,
        };

        // Encriptar
        let encrypted = crypto.encrypt(&original).unwrap();
        assert!(!encrypted.ciphertext.is_empty());
        assert_eq!(encrypted.nonce.len(), 12);

        // Desencriptar
        let decrypted: TestData = crypto.decrypt(&encrypted).unwrap();
        assert_eq!(original, decrypted);
    }

    #[test]
    fn test_signature() {
        let key = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
        let crypto = CryptoHandler::new(key).unwrap();

        let data = TestData {
            message: "Test".to_string(),
            value: 123,
        };

        let encrypted = crypto.encrypt(&data).unwrap();
        let signature = crypto.sign(&encrypted).unwrap();

        assert_eq!(signature.len(), 32); // SHA-256 produces 32 bytes
        assert!(crypto.verify_signature(&encrypted, &signature).unwrap());
    }

    #[test]
    fn test_invalid_key() {
        // Key demasiado corta
        assert!(CryptoHandler::new("short").is_err());
        
        // Key con caracteres inválidos
        assert!(CryptoHandler::new("zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz").is_err());
        
        // Key válida
        let key = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
        assert!(CryptoHandler::new(key).is_ok());
    }
}