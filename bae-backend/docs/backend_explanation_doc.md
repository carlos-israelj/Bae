# 📘 Documentación General del Backend API
## Para el Equipo de Frontend

---

## 🎯 Objetivo del Backend

El Backend API es un **servicio intermediario** entre el frontend y la blockchain que:

1. **Lee datos encriptados** del smart contract en blockchain
2. **Desencripta** esos datos usando AES-256-GCM
3. **Expone endpoints REST** para que el frontend pueda consumir datos legibles

### ¿Por qué necesitamos este backend?

```
❌ SIN Backend:
Frontend → Blockchain → Datos ENCRIPTADOS (no puedes ver temperatura/humedad)

✅ CON Backend:
Frontend → Backend API → Blockchain → Backend desencripta → Frontend recibe datos LEGIBLES
```

---

## 🏗️ Arquitectura Completa del Sistema

```
┌─────────────────┐
│  Sensor ESP32   │  1. Genera datos de temperatura/humedad
│  (Simulador)    │     Ejemplo: {"temperature": 23.5, "humidity": 55.2}
└────────┬────────┘
         │
         │ 2. Publica vía MQTT
         ▼
┌─────────────────┐
│  Gateway Rust   │  3. Recibe datos del sensor
│                 │  4. ENCRIPTA con AES-256-GCM
│                 │     Resultado: "0x8a3f2e1b9c..." (ilegible)
│                 │  5. Firma con SHA-256
└────────┬────────┘
         │
         │ 6. Envía datos encriptados
         ▼
┌─────────────────┐
│ Smart Contract  │  7. Almacena datos ENCRIPTADOS en blockchain
│  (Solidity)     │     - Ciphertext (datos encriptados)
│                 │     - Nonce (para desencriptación)
│                 │     - Signature (para verificación)
│                 │     - Timestamp, Block Number, Device ID
└────────┬────────┘
         │
         ▼
    ┌───────────────────────────────────┐
    │                                   │
    ▼                                   ▼
┌─────────────────┐           ┌─────────────────┐
│  Frontend Solo  │           │ Backend API +   │
│                 │           │   Frontend      │
│  ❌ Ve datos    │           │                 │
│  encriptados    │           │  ✅ Ve datos    │
│                 │           │  desencriptados │
│  {"ciphertext": │           │                 │
│   "0x8a3f2e"}   │           │  {"temperature":│
│                 │           │   23.5°C}       │
└─────────────────┘           └─────────────────┘
```

---

## 🔄 Flujo Completo: Del Sensor a la Pantalla

### Paso 1: Sensor ESP32 Genera Datos 📡

**¿Qué es?**
Un sensor simulado (en Rust) que genera datos de temperatura y humedad cada 30 segundos.

**¿Qué hace?**
```rust
// El sensor crea un JSON con los datos
{
  "device_id": "ESP32-001",
  "temperature": 23.5,      // Grados Celsius
  "humidity": 55.2,         // Porcentaje
  "timestamp": 1728421234   // Unix timestamp
}
```

**Tipos de lecturas que genera:**
- **85% Normal**: Temperatura entre 21-25°C
- **10% Alerta de Frío**: Temperatura entre 15-17°C 🥶
- **5% Alerta de Calor**: Temperatura entre 29-31°C ⚠️

**Frecuencia:** Una lectura cada 30 segundos

**Ubicación física:** Simulador corriendo en Render (servidor en la nube)

---

### Paso 2: Publicación vía MQTT 📨

**¿Qué es MQTT?**
Un protocolo de mensajería ligero para IoT (Internet of Things). Es como un "sistema de correo" para dispositivos.

**Analogía:**
- El sensor es como una **estación meteorológica**
- MQTT es el **servicio postal**
- El Gateway es el **buzón receptor**

**Cómo funciona:**
```
Sensor → Publica mensaje → Broker MQTT → Gateway suscrito recibe mensaje
```

**Código real del sensor (Rust):**
```rust
// 1. El sensor crea el mensaje JSON
let reading = SensorReading {
    device_id: "ESP32-001".to_string(),
    temperature: 23.5,
    humidity: 55.2,
    timestamp: 1728421234,
};

// 2. Convierte a bytes
let payload = serde_json::to_vec(&reading)?;

// 3. Publica al topic MQTT
let topic = "bae/sensors/ESP32-001/data";
self.client.publish(topic, QoS::AtLeastOnce, false, payload).await?;
```

**Detalles técnicos:**
- **Broker MQTT**: `broker.hivemq.com` (puerto 1883)
- **Topic (canal)**: `bae/sensors/{device_id}/data`
- **Calidad de Servicio**: QoS 1 (al menos una vez - garantiza entrega)
- **Frecuencia**: Cada 30 segundos
- **Timeout**: 5 segundos por publicación

**¿Por qué MQTT y no HTTP?**
- ✅ Más eficiente para IoT
- ✅ Maneja desconexiones automáticamente
- ✅ Menor consumo de batería (importante para sensores reales)
- ✅ Perfecto para comunicación sensor → servidor

---

### Paso 3: Gateway Recibe el Mensaje 📬

**¿Qué es el Gateway?**
Un servidor en Rust que actúa como **intermediario inteligente** entre sensores y blockchain.

**Responsabilidades:**
1. ✅ Escuchar mensajes MQTT
2. ✅ Validar datos del sensor
3. ✅ Encriptar datos
4. ✅ Firmar datos
5. ✅ Enviar a blockchain

**Código del Gateway:**
```rust
// 1. Gateway se suscribe al topic
self.mqtt_client.subscribe("bae/sensors/+/data", QoS::AtLeastOnce).await?;
//                                        ↑
//                        "+" = wildcard (cualquier device_id)

// 2. Cuando llega un mensaje
match self.mqtt_eventloop.poll().await {
    Ok(Event::Incoming(Packet::Publish(publish))) => {
        // 3. Parsear el JSON
        let reading: SensorReading = serde_json::from_slice(&publish.payload)?;
        
        // 4. Validar datos
        validate_reading(&reading)?;
        
        // 5. Procesar (encriptar y enviar a blockchain)
        process_sensor_data(reading).await?;
    }
}
```

**Validaciones que hace el Gateway:**
```rust
fn validate_reading(reading: &SensorReading) -> Result<()> {
    // ❌ Device ID vacío o muy largo
    if reading.device_id.is_empty() || reading.device_id.len() > 100 {
        return Err("Invalid device_id");
    }
    
    // ❌ Temperatura fuera de rango (-50°C a 100°C)
    if !(-50.0..=100.0).contains(&reading.temperature) {
        return Err("Temperature out of range");
    }
    
    // ❌ Humedad fuera de rango (0% a 100%)
    if !(0.0..=100.0).contains(&reading.humidity) {
        return Err("Humidity out of range");
    }
    
    // ❌ Timestamp del futuro o muy antiguo (>1 hora)
    if reading.timestamp > now + 300 {
        return Err("Timestamp is in the future");
    }
    
    // ✅ Todo OK
    Ok(())
}
```

---

### Paso 4: Encriptación AES-256-GCM 🔐

**¿Qué es AES-256-GCM?**
- **AES**: Advanced Encryption Standard (estándar de encriptación)
- **256**: Tamaño de la clave (256 bits = muy seguro)
- **GCM**: Galois/Counter Mode (modo que garantiza autenticidad)

**Analogía:**
Imagina que la encriptación es como:
1. Meter un documento en una **caja fuerte** (AES-256)
2. Agregar un **sello de seguridad** para detectar si alguien lo manipuló (GCM)

**Código de encriptación:**
```rust
pub fn encrypt(data: &SensorReading) -> Result<EncryptedPayload> {
    // 1. Convertir datos a JSON
    let plaintext = serde_json::to_vec(&data)?;
    // plaintext = b'{"device_id":"ESP32-001","temperature":23.5,...}'
    
    // 2. Generar un "nonce" aleatorio (número usado una sola vez)
    let mut nonce_bytes = [0u8; 12];
    OsRng.fill_bytes(&mut nonce_bytes);
    // nonce = [0x1a, 0x2b, 0x3c, 0x4d, ...]  ← 12 bytes aleatorios
    
    // 3. Encriptar con la clave secreta
    let ciphertext = cipher.encrypt(nonce, plaintext)?;
    // ciphertext = [0x8a, 0x3f, 0x2e, 0x1b, ...]  ← datos encriptados
    
    // 4. Retornar ambos
    Ok(EncryptedPayload {
        ciphertext,  // Datos encriptados (~108 bytes)
        nonce,       // Nonce usado (12 bytes)
    })
}
```

**Antes vs Después:**

**ANTES (legible):**
```json
{
  "device_id": "ESP32-001",
  "temperature": 23.5,
  "humidity": 55.2,
  "timestamp": 1728421234
}
```

**DESPUÉS (encriptado):**
```
Ciphertext: 8a3f2e1b9c4d5f6e7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f...
Nonce:      1a2b3c4d5e6f7a8b9c0d1e2f
```

**¿Por qué necesitamos el nonce?**
- El nonce es como el "código de desbloqueo único" para cada mensaje
- Sin el nonce correcto, no se puede desencriptar
- Cada mensaje tiene un nonce diferente (por seguridad)

**Componentes de la encriptación:**
```
┌─────────────────────────────────────────┐
│         ENCRYPTION_KEY                   │
│  (64 caracteres hex = 32 bytes)         │
│  Ejemplo: 0123456789abcdef...           │
└─────────────┬───────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│         AES-256-GCM Cipher              │
└─────────────┬───────────────────────────┘
              │
    ┌─────────┴──────────┐
    │                    │
    ▼                    ▼
Plaintext           Random Nonce
(datos)             (12 bytes)
    │                    │
    └─────────┬──────────┘
              ▼
         Ciphertext
      (datos encriptados
       + auth tag)
```

---

### Paso 5: Firma SHA-256 ✍️

**¿Qué es SHA-256?**
Un algoritmo de hash criptográfico que genera una "huella digital" única de los datos.

**Analogía:**
La firma es como un **sello de lacre** en una carta:
- No puedes falsificarlo
- Si alguien abre la carta y la vuelve a cerrar, se nota
- Es único para cada contenido

**Código de firma:**
```rust
pub fn sign(encrypted: &EncryptedPayload) -> Vec<u8> {
    let mut hasher = Sha256::new();
    
    // 1. Hash del ciphertext
    hasher.update(&encrypted.ciphertext);
    
    // 2. Hash del nonce
    hasher.update(&encrypted.nonce);
    
    // 3. Obtener firma final (32 bytes)
    let signature = hasher.finalize().to_vec();
    // signature = [0x9f, 0x8e, 0x7d, 0x6c, ...]  ← 32 bytes
    
    signature
}
```

**¿Para qué sirve la firma?**
1. **Integridad**: Detectar si los datos fueron modificados
2. **Autenticidad**: Verificar que vienen del Gateway legítimo
3. **No-repudio**: Probar que los datos existen en ese momento

**Ejemplo:**
```
Datos originales:
  Ciphertext: 8a3f2e1b...
  Nonce: 1a2b3c4d...

Firma SHA-256:
  9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e

Si cambias UN SOLO BIT de los datos:
  Nueva firma: 6a2d8f3e... (completamente diferente!)
```

---

### Paso 6: Envío a Blockchain 📤

**¿Qué se envía?**
El Gateway envía una **transacción** al smart contract con:

```rust
contract.submitSensorData(
    "ESP32-001",                    // device_id
    ciphertext,                     // datos encriptados (108 bytes)
    nonce,                          // nonce (12 bytes)
    signature,                      // firma SHA-256 (32 bytes)
    1728421234                      // timestamp
)
```

**Código real del Gateway:**
```rust
pub async fn submit_sensor_data(
    device_id: &str,
    ciphertext: &[u8],
    nonce: &[u8],
    signature: &[u8],
    timestamp: u64,
) -> Result<String> {
    // 1. Preparar la llamada al contrato
    let call = self.contract.submit_sensor_data(
        device_id.to_string(),
        Bytes::from(ciphertext.to_vec()),
        Bytes::from(nonce.to_vec()),
        Bytes::from(signature.to_vec()),
        U256::from(timestamp),
    );
    
    // 2. Estimar gas necesario
    let gas_estimate = call.estimate_gas().await?;
    
    // 3. Enviar transacción
    let pending_tx = call.send().await?;
    let tx_hash = pending_tx.tx_hash();
    
    // 4. Esperar confirmación (máximo 120 segundos)
    let receipt = pending_tx.await?;
    
    // 5. Verificar que fue exitosa
    if receipt.status == Some(U64::from(1)) {
        Ok(format!("{:?}", tx_hash))
    } else {
        Err("Transaction failed")
    }
}
```

**Retry Logic (Reintentos):**
```rust
// Si falla, reintenta hasta 3 veces
let mut attempts = 0;
let max_attempts = 3;

loop {
    attempts += 1;
    
    match submit_to_blockchain().await {
        Ok(tx_hash) => {
            info!("✅ Success: {}", tx_hash);
            break;
        }
        Err(e) if attempts < max_attempts => {
            warn!("⚠️ Attempt {}/{} failed. Retrying...", attempts, max_attempts);
            tokio::time::sleep(Duration::from_secs(5)).await;
        }
        Err(e) => {
            error!("❌ All attempts failed: {}", e);
            return Err(e);
        }
    }
}
```

**¿Cuánto tarda?**
- **Envío de TX**: ~1 segundo
- **Confirmación**: 10-30 segundos (depende de la red)
- **Total**: ~30 segundos por lectura

**Logs del Gateway:**
```
📥 ESP32-001 | T=23.5°C H=55.2% | ts=1728421234
🔒 Data encrypted (ciphertext: 108 bytes, nonce: 12 bytes)
📤 Submitting to contract...
   Device: ESP32-001
   Data size: 108 bytes
⛽ Estimated gas: 150000
⏳ TX sent: 0xabc123...
🔗 Explorer: https://blockscout-passet-hub.parity-testnet.parity.io/tx/0xabc123...
⏳ Waiting for confirmation (max 120s)...
✅ Confirmed!
   Block: 12345
   Gas used: 147823
   Status: Success
```

---

### Paso 7: Almacenamiento en Blockchain 💾

**¿Qué guarda el Smart Contract?**

```solidity
struct SensorData {
    string deviceId;        // "ESP32-001"
    bytes ciphertext;       // Datos encriptados (108 bytes)
    bytes nonce;            // Nonce para desencriptación (12 bytes)
    bytes signature;        // Firma SHA-256 (32 bytes)
    uint256 timestamp;      // 1728421234
    uint256 blockNumber;    // 12345 (auto-generado)
}
```

**Ejemplo de datos guardados:**
```json
{
  "deviceId": "ESP32-001",
  "ciphertext": "0x8a3f2e1b9c4d5f6e7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f",
  "nonce": "0x1a2b3c4d5e6f7a8b9c0d1e2f",
  "signature": "0x9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e",
  "timestamp": 1728421234,
  "blockNumber": 12345
}
```

**Características de la blockchain:**
- ✅ **Inmutable**: Una vez guardado, no se puede modificar
- ✅ **Permanente**: Los datos nunca se borran
- ✅ **Público**: Cualquiera puede ver que hay datos (pero encriptados)
- ✅ **Verificable**: Cualquiera puede verificar la firma
- ❌ **NO legible**: Nadie puede ver temperatura/humedad sin la clave

**Evento emitido:**
```solidity
event SensorDataSubmitted(
    string indexed deviceId,  // "ESP32-001"
    uint256 timestamp,        // 1728421234
    uint256 blockNumber,      // 12345
    uint256 index             // 0, 1, 2, ... (índice secuencial)
);
```

Este evento permite al frontend:
- Saber cuándo hay nueva data
- Actualizar en tiempo real
- Llevar un contador

---

## 🔐 ¿Qué es la Encriptación?

### Analogía Simple

Imagina que los datos del sensor son una **carta**:

1. **Sensor** escribe: "Temperatura: 23.5°C"
2. **Gateway** mete la carta en un **sobre cerrado con candado** (encriptación)
3. **Blockchain** guarda el sobre cerrado (nadie puede leer qué dice)
4. **Backend API** tiene la **llave del candado** (clave de encriptación)
5. **Backend** abre el sobre y lee: "Temperatura: 23.5°C"
6. **Frontend** recibe el mensaje legible

### Datos Reales

**Antes de encriptar (lo que el sensor envía):**
```json
{
  "device_id": "ESP32-001",
  "temperature": 23.5,
  "humidity": 55.2,
  "timestamp": 1728421234
}
```

**Después de encriptar (lo que se guarda en blockchain):**
```json
{
  "deviceId": "ESP32-001",
  "ciphertext": "0x8a3f2e1b9c4d5f6e7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f...",
  "nonce": "0x1a2b3c4d5e6f7a8b9c0d1e2f",
  "signature": "0x9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c...",
  "timestamp": 1728421234,
  "blockNumber": 12345
}
```

**¿Puedes ver la temperatura en los datos encriptados?** ❌ NO, es completamente ilegible.

---

## 🛠️ ¿Qué Hace el Backend API?

### Función Principal: Desencriptación

El backend tiene una **clave secreta** (ENCRYPTION_KEY) que le permite:

1. Leer el `ciphertext` (datos encriptados)
2. Usar el `nonce` (número aleatorio usado en la encriptación)
3. Aplicar el algoritmo AES-256-GCM con la clave
4. Obtener los datos originales

### Algoritmo de Desencriptación

```javascript
// Pseudocódigo simplificado
function desencriptar(datosEncriptados) {
  // 1. Obtener componentes
  const ciphertext = datosEncriptados.ciphertext;
  const nonce = datosEncriptados.nonce;
  const claveSecreta = process.env.ENCRYPTION_KEY;
  
  // 2. Crear desencriptador
  const desencriptador = crearAES256GCM(claveSecreta, nonce);
  
  // 3. Desencriptar
  const datosLegibles = desencriptador.desencriptar(ciphertext);
  
  // 4. Convertir de bytes a JSON
  return JSON.parse(datosLegibles);
  // Resultado: {"temperature": 23.5, "humidity": 55.2, ...}
}
```

---

## 📡 Endpoints del Backend API

El backend expone 6 endpoints REST que el frontend puede usar:

### 1. Health Check
**¿Para qué?** Verificar que el backend está funcionando.

```http
GET /health
```

**Respuesta:**
```json
{
  "status": "ok",
  "timestamp": "2025-01-12T15:30:00.000Z",
  "uptime": 3600
}
```

**Ejemplo con curl:**
```bash
curl https://bae-backend-api.onrender.com/health
```

---

### 2. Última Lectura Desencriptada
**¿Para qué?** Obtener la lectura más reciente del sensor con temperatura y humedad legibles.

```http
GET /api/readings/latest/decrypt
```

**Lo que hace internamente:**
1. Conecta con blockchain
2. Llama a `contract.getLatestReading()`
3. Recibe datos encriptados
4. Desencripta usando la clave secreta
5. Retorna datos legibles

**Respuesta:**
```json
{
  "deviceId": "ESP32-001",
  "temperature": 23.5,
  "humidity": 55.2,
  "timestamp": 1728421234,
  "timestampDate": "2024-10-08T15:20:34.000Z",
  "blockNumber": 12345
}
```

**Ejemplo con curl:**
```bash
curl https://bae-backend-api.onrender.com/api/readings/latest/decrypt
```

**Uso en Frontend:**
```typescript
const { data } = useLatestReading();
// data.temperature → 23.5
// data.humidity → 55.2
```

---

### 3. Lectura Específica por Índice
**¿Para qué?** Obtener una lectura específica del historial.

```http
GET /api/readings/:index/decrypt
```

**Parámetros:**
- `index`: Número entero (0 a totalReadings-1)

**Ejemplo:**
```bash
# Obtener la primera lectura (índice 0)
curl https://bae-backend-api.onrender.com/api/readings/0/decrypt

# Obtener la lectura número 42
curl https://bae-backend-api.onrender.com/api/readings/42/decrypt

# Obtener la lectura número 100
curl https://bae-backend-api.onrender.com/api/readings/100/decrypt
```

**Respuesta:**
```json
{
  "deviceId": "ESP32-001",
  "temperature": 21.8,
  "humidity": 62.5,
  "timestamp": 1728420000,
  "timestampDate": "2024-10-08T15:00:00.000Z",
  "blockNumber": 12340
}
```

**Uso en Frontend:**
```typescript
const { data } = useReading(42);
// Muestra la lectura con índice 42
```

---

### 4. Historial con Paginación
**¿Para qué?** Obtener múltiples lecturas desencriptadas de una vez.

```http
GET /api/readings/history?limit=50&offset=0
```

**Parámetros:**
- `limit` (opcional): Cuántas lecturas retornar (1-100, default: 50)
- `offset` (opcional): Cuántas lecturas saltar (default: 0)

**Ejemplos:**

```bash
# Últimas 50 lecturas (default)
curl https://bae-backend-api.onrender.com/api/readings/history

# Últimas 20 lecturas
curl https://bae-backend-api.onrender.com/api/readings/history?limit=20

# Lecturas 20-40 (para paginación)
curl https://bae-backend-api.onrender.com/api/readings/history?limit=20&offset=20

# Lecturas 100-150
curl https://bae-backend-api.onrender.com/api/readings/history?limit=50&offset=100

# Últimas 100 lecturas
curl https://bae-backend-api.onrender.com/api/readings/history?limit=100
```

**Respuesta:**
```json
{
  "readings": [
    {
      "deviceId": "ESP32-001",
      "temperature": 24.1,
      "humidity": 54.8,
      "timestamp": 1728421264,
      "timestampDate": "2024-10-08T15:21:04.000Z",
      "blockNumber": 12346
    },
    {
      "deviceId": "ESP32-001",
      "temperature": 23.5,
      "humidity": 55.2,
      "timestamp": 1728421234,
      "timestampDate": "2024-10-08T15:20:34.000Z",
      "blockNumber": 12345
    }
    // ... más lecturas
  ],
  "total": 150,        // Total de lecturas en blockchain
  "limit": 20,         // Cuántas pediste
  "offset": 0,         // Desde qué posición
  "returned": 20       // Cuántas se retornaron realmente
}
```

**Uso en Frontend:**
```typescript
// Obtener últimas 50
const { data } = useReadingHistory({ limit: 50 });

// Paginación: página 1 (lecturas 0-19)
const page1 = useReadingHistory({ limit: 20, offset: 0 });

// Paginación: página 2 (lecturas 20-39)
const page2 = useReadingHistory({ limit: 20, offset: 20 });
```

---

### 5. Total de Lecturas
**¿Para qué?** Saber cuántas lecturas hay en total en la blockchain.

```http
GET /api/readings/count
```

**Respuesta:**
```json
{
  "total": 150
}
```

**Ejemplo:**
```bash
curl https://bae-backend-api.onrender.com/api/readings/count
```

**Uso en Frontend:**
```typescript
const { data } = useReadingCount();
// data.total → 150

// Útil para calcular páginas:
const totalPages = Math.ceil(data.total / pageSize);
```

---

### 6. Estadísticas
**¿Para qué?** Obtener métricas calculadas (promedios, alertas, etc.).

```http
GET /api/readings/stats?limit=20
```

**Parámetros:**
- `limit` (opcional): Sobre cuántas lecturas calcular (default: 20)

**Lo que hace:**
1. Obtiene las últimas N lecturas
2. Desencripta todas
3. Calcula:
   - Temperatura promedio
   - Humedad promedio
   - Temperatura mínima y máxima
   - Cuenta alertas de calor (>29°C)
   - Cuenta alertas de frío (<17°C)

**Ejemplos:**
```bash
# Estadísticas de últimas 20 lecturas
curl https://bae-backend-api.onrender.com/api/readings/stats

# Estadísticas de últimas 100 lecturas
curl https://bae-backend-api.onrender.com/api/readings/stats?limit=100

# Estadísticas de últimas 50 lecturas
curl https://bae-backend-api.onrender.com/api/readings/stats?limit=50
```

**Respuesta:**
```json
{
  "total": 150,              // Total de lecturas en blockchain
  "analyzed": 50,            // Cuántas se analizaron
  "avgTemperature": 23.5,    // Temperatura promedio
  "avgHumidity": 55.8,       // Humedad promedio
  "minTemperature": 16.2,    // Temperatura mínima encontrada
  "maxTemperature": 30.1,    // Temperatura máxima encontrada
  "hotAlerts": 3,            // Cuántas veces >29°C
  "coldAlerts": 2            // Cuántas veces <17°C
}
```

**Uso en Frontend:**
```typescript
const { data: stats } = useReadingStats(50);

// Mostrar
<p>Temperatura promedio: {stats.avgTemperature}°C</p>
<p>Alertas de calor: {stats.hotAlerts}</p>
<p>Alertas de frío: {stats.coldAlerts}</p>
```

---

## 🔄 Flujo Completo de una Request

### Ejemplo: Frontend quiere ver la última lectura

```
1. Usuario abre el dashboard
   ↓
2. Frontend ejecuta: useLatestReading()
   ↓
3. Hook hace fetch a: https://bae-backend-api.onrender.com/api/readings/latest/decrypt
   ↓
4. Backend recibe la request
   ↓
5. Backend conecta a blockchain (RPC)
   ↓
6. Backend llama: contract.getLatestReading()
   ↓
7. Blockchain retorna datos ENCRIPTADOS:
   {
     ciphertext: "0x8a3f2e1b...",
     nonce: "0x1a2b3c...",
     ...
   }
   ↓
8. Backend desencripta usando ENCRYPTION_KEY
   ↓
9. Backend obtiene datos LEGIBLES:
   {
     temperature: 23.5,
     humidity: 55.2,
     ...
   }
   ↓
10. Backend responde al frontend con JSON
   ↓
11. Frontend recibe datos y los muestra:
    🌡️ Temperatura: 23.5°C
    💧 Humedad: 55.2%
```

**Tiempo total:** ~1-2 segundos

---

## 🔑 Configuración del Backend

### Variables de Entorno Necesarias

El backend necesita estas variables para funcionar:

```bash
# Puerto donde corre el servidor
PORT=3001

# URL del frontend (para CORS)
FRONTEND_URL=https://tu-frontend.vercel.app

# URL del RPC de Polkadot
RPC_URL=https://testnet-passet-hub-eth-rpc.polkadot.io

# Dirección del smart contract
CONTRACT_ADDRESS=0xfD0b399898efC0186E32eb81B630d7Cf7Bb6f217

# Clave de encriptación (DEBE ser la misma del Gateway)
ENCRYPTION_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef

# Ambiente
NODE_ENV=production
```

### ⚠️ IMPORTANTE: La Clave de Encriptación

- **¿Qué es?** Una cadena de 64 caracteres hexadecimales (32 bytes)
- **¿Dónde está?** En las variables de entorno del backend (NUNCA en frontend)
- **¿Por qué es secreta?** Si alguien la obtiene, puede desencriptar todos los datos
- **¿Por qué debe ser la misma del Gateway?** Porque el Gateway encriptó con esa clave

```
Gateway encripta con: CLAVE_ABC123
Backend desencripta con: CLAVE_ABC123  ← Debe ser la MISMA

Si son diferentes:
Gateway encripta con: CLAVE_ABC123
Backend desencripta con: CLAVE_XYZ789  ← ERROR: No puede desencriptar
```

---

## 🌐 URLs del Backend

### Desarrollo (Local)
```
http://localhost:3001
```

Usar cuando:
- Estás desarrollando en tu computadora
- El backend corre con `npm run dev`

### Producción (Render)
```
https://bae-backend-api.onrender.com
```

Usar cuando:
- El backend está desplegado en Render
- Estás en producción
- Quieres probar con datos reales

### Configuración en Frontend

**Archivo `.env.local` (desarrollo):**
```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
```

**Archivo `.env.production` (producción):**
```bash
NEXT_PUBLIC_API_URL=https://bae-backend-api.onrender.com
```

---

## 📊 Tipos de Datos

### Lectura Desencriptada (DecryptedReading)

```typescript
interface DecryptedReading {
  deviceId: string;        // "ESP32-001"
  temperature: number;     // 23.5 (en grados Celsius)
  humidity: number;        // 55.2 (en porcentaje)
  timestamp: number;       // 1728421234 (Unix timestamp)
  timestampDate: string;   // "2024-10-08T15:20:34.000Z" (ISO string)
  blockNumber: number;     // 12345 (número de bloque en blockchain)
}
```

### Historial (ReadingHistoryResponse)

```typescript
interface ReadingHistoryResponse {
  readings: DecryptedReading[];  // Array de lecturas
  total: number;                 // Total en blockchain
  limit: number;                 // Cuántas se pidieron
  offset: number;                // Desde qué posición
  returned: number;              // Cuántas se retornaron
}
```

### Estadísticas (ReadingStats)

```typescript
interface ReadingStats {
  total: number;           // Total de lecturas en blockchain
  analyzed: number;        // Cuántas se analizaron
  avgTemperature: number;  // Temperatura promedio
  avgHumidity: number;     // Humedad promedio
  minTemperature: number;  // Temperatura mínima
  maxTemperature: number;  // Temperatura máxima
  hotAlerts: number;       // Alertas de calor (>29°C)
  coldAlerts: number;      // Alertas de frío (<17°C)
}
```

---

## ⚡ Límites y Consideraciones

### Límites del API

| Endpoint | Límite |
|----------|--------|
| `/api/readings/history` | Máximo 100 lecturas por request |
| `/api/readings/stats` | Analiza máximo 100 lecturas |
| Requests por minuto | Sin límite actual (considerar rate limiting en futuro) |

### Tiempos de Respuesta Esperados

| Endpoint | Tiempo Promedio |
|----------|-----------------|
| `/health` | ~50ms |
| `/api/readings/latest/decrypt` | ~1-2 segundos |
| `/api/readings/:index/decrypt` | ~1-2 segundos |
| `/api/readings/history` (50 lecturas) | ~5-10 segundos |
| `/api/readings/stats` (20 lecturas) | ~3-5 segundos |

### ¿Por qué es "lento"?

1. **Blockchain no es instantánea**: Leer de blockchain toma ~1 segundo
2. **Desencriptación**: Cada lectura requiere desencriptar (proceso criptográfico)
3. **Red**: La blockchain está en internet, no local

**Optimizaciones en el frontend:**
- Usar `refetchInterval` para actualizar cada 30 segundos
- Usar `staleTime` para no refetchear innecesariamente
- Mostrar loading states mientras se cargan datos

---

## 🐛 Manejo de Errores

### Errores Comunes

#### 1. "Failed to decrypt data"

**Causa:** La clave de encriptación es incorrecta o los datos están corruptos.

**Solución:** Verificar que `ENCRYPTION_KEY` en el backend sea la misma del Gateway.

#### 2. "Reading not found"

**Causa:** El índice solicitado no existe.

**Ejemplo:**
```bash
# Total de lecturas: 100
# Solicitas índice 150 → Error
curl /api/readings/150/decrypt
```

**Solución:** Verificar primero el total con `/api/readings/count`.

#### 3. "Cannot connect to RPC"

**Causa:** No se puede conectar a la blockchain.

**Posibles razones:**
- Internet caído
- RPC de Polkadot inactivo
- URL incorrecta

#### 4. "CORS Error"

**Causa:** El frontend está en un dominio no autorizado.

**Solución:** Actualizar `FRONTEND_URL` en las variables de entorno del backend.

### Manejo en Frontend

```typescript
const { data, isLoading, error } = useLatestReading();

if (isLoading) {
  return <div>Cargando...</div>;
}

if (error) {
  return <div>Error: {error.message}</div>;
}

// Mostrar datos
return <div>Temperatura: {data.temperature}°C</div>;
```

---

## 🧪 Testing del Backend

### Probar Manualmente con curl

```bash
# 1. Health check
curl https://bae-backend-api.onrender.com/health

# 2. Última lectura
curl https://bae-backend-api.onrender.com/api/readings/latest/decrypt

# 3. Total
curl https://bae-backend-api.onrender.com/api/readings/count

# 4. Historial
curl https://bae-backend-api.onrender.com/api/readings/history?limit=5
```

### Probar desde el Frontend

El frontend incluye una página de testing en `/test`:

```typescript
// Visitar http://localhost:3000/test
// Ejecuta automáticamente:
// - Health check
// - Conteo de lecturas
// - Última lectura
// - Historial
```

---

---

## 📊 Resumen Visual del Flujo Completo

### De Sensor a Pantalla en 7 Pasos

```
┌────────────── PASO 1 ──────────────┐
│  Sensor Genera Datos               │
│  {"temperature": 23.5, ...}        │
│  ✅ LEGIBLE                         │
└──────────────┬─────────────────────┘
               │ 30 segundos
               ▼
┌────────────── PASO 2 ──────────────┐
│  Publicación MQTT                  │
│  Topic: bae/sensors/ESP32-001/data │
│  QoS: AtLeastOnce                  │
└──────────────┬─────────────────────┘
               │ ~100ms
               ▼
┌────────────── PASO 3 ──────────────┐
│  Gateway Recibe                    │
│  - Valida device_id                │
│  - Valida temperatura (-50 a 100)  │
│  - Valida humedad (0 a 100)        │
│  - Valida timestamp                │
└──────────────┬─────────────────────┘
               │ ~10ms
               ▼
┌────────────── PASO 4 ──────────────┐
│  Encriptación AES-256-GCM          │
│  Plaintext → Ciphertext            │
│  {"temp": 23.5} → 0x8a3f2e1b...    │
│  ❌ ILEGIBLE                        │
│  + Genera nonce (12 bytes)         │
└──────────────┬─────────────────────┘
               │ ~5ms
               ▼
┌────────────── PASO 5 ──────────────┐
│  Firma SHA-256                     │
│  Hash(ciphertext + nonce)          │
│  → signature (32 bytes)            │
│  ✅ Sello de autenticidad           │
└──────────────┬─────────────────────┘
               │ ~2ms
               ▼
┌────────────── PASO 6 ──────────────┐
│  Envío a Blockchain                │
│  submitSensorData(                 │
│    deviceId, ciphertext,           │
│    nonce, signature, timestamp     │
│  )                                 │
│  Retry: hasta 3 intentos           │
└──────────────┬─────────────────────┘
               │ ~30 segundos
               ▼
┌────────────── PASO 7 ──────────────┐
│  Almacenado en Blockchain          │
│  Block #12345                      │
│  TX: 0xabc123...                   │
│  ✅ Permanente e inmutable          │
│  ❌ Datos encriptados (protegidos)  │
└──────────────┬─────────────────────┘
               │
         ┌─────┴──────┐
         │            │
         ▼            ▼
   ┌─────────┐  ┌─────────┐
   │Frontend │  │Backend  │
   │ Solo    │  │  API    │
   ├─────────┤  ├─────────┤
   │Ve datos │  │Ve datos │
   │ENCRIPTA │  │DESCEN-  │
   │DOS ❌   │  │CRIPTADOS│
   │         │  │✅       │
   │No puede │  │Temp:    │
   │ver temp │  │23.5°C   │
   └─────────┘  └─────────┘
```

### Tiempos Promedio

| Paso | Proceso | Tiempo |
|------|---------|--------|
| 1 | Generación de datos | Instantáneo |
| 2 | Publicación MQTT | ~100ms |
| 3 | Recepción y validación | ~10ms |
| 4 | Encriptación AES-256-GCM | ~5ms |
| 5 | Firma SHA-256 | ~2ms |
| 6 | Envío a blockchain | ~1s |
| 7 | Confirmación en blockchain | ~30s |
| **TOTAL** | **Sensor → Blockchain** | **~31 segundos** |

### Tamaños de Datos

| Componente | Tamaño | Nota |
|------------|--------|------|
| Datos originales (JSON) | ~80 bytes | Legible |
| Ciphertext | ~108 bytes | Encriptado |
| Nonce | 12 bytes | Necesario para desencriptar |
| Signature | 32 bytes | Firma SHA-256 |
| **Total almacenado** | **~152 bytes** | Por lectura |
| Con metadata (device_id, timestamp, block) | ~200 bytes | En blockchain |

### Componentes y sus Responsabilidades

```
┌─────────────────────────────────────────────┐
│         SENSOR SIMULATOR (Rust)             │
├─────────────────────────────────────────────┤
│ ✅ Generar datos realistas                   │
│ ✅ Simular alertas (frío/calor)             │
│ ✅ Publicar cada 30 segundos                 │
│ ✅ Manejo de reconexión MQTT                 │
│ 📍 Deploy: Render.com                       │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│         GATEWAY (Rust)                      │
├─────────────────────────────────────────────┤
│ ✅ Escuchar topic MQTT                       │
│ ✅ Validar datos del sensor                  │
│ ✅ Encriptar con AES-256-GCM                 │
│ ✅ Firmar con SHA-256                        │
│ ✅ Enviar a smart contract                   │
│ ✅ Retry logic (hasta 3 intentos)           │
│ ✅ Estadísticas en tiempo real               │
│ 📍 Deploy: Render.com                       │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│         SMART CONTRACT (Solidity)           │
├─────────────────────────────────────────────┤
│ ✅ Almacenar datos encriptados               │
│ ✅ Guardar nonce y signature                 │
│ ✅ Emitir eventos                            │
│ ✅ Permitir lectura de historial             │
│ ❌ NO desencripta (no tiene la clave)       │
│ 📍 Deploy: Polkadot (Paseo Hub Testnet)    │
│ 📍 Address: 0xfD0b...f217                   │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│         BACKEND API (Node.js)               │
├─────────────────────────────────────────────┤
│ ✅ Leer datos del smart contract             │
│ ✅ Desencriptar con la misma clave           │
│ ✅ Exponer endpoints REST                    │
│ ✅ Calcular estadísticas                     │
│ ✅ Paginación para historial                 │
│ 🔐 Tiene la ENCRYPTION_KEY (secreto)        │
│ 📍 Deploy: Render.com                       │
│ 📍 URL: bae-backend-api.onrender.com       │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│         FRONTEND (Next.js + Viem)           │
├─────────────────────────────────────────────┤
│ ✅ Consumir Backend API                      │
│ ✅ Mostrar temperatura y humedad             │
│ ✅ Gráficas en tiempo real                   │
│ ✅ Dashboard interactivo                     │
│ ✅ Alertas visuales (frío/calor)            │
│ ❌ NO tiene la clave de encriptación        │
│ ❌ NO puede desencriptar por sí solo        │
│ 📍 Deploy: Vercel/Netlify                   │
└─────────────────────────────────────────────┘
```

### Flujo de la Clave de Encriptación

```
┌──────────────────────────────────────────┐
│      ENCRYPTION_KEY                      │
│  (64 caracteres hex = 32 bytes)          │
│  0123456789abcdef0123456789abcdef...     │
└────────────┬──────────────┬──────────────┘
             │              │
      ┌──────▼─────┐   ┌────▼──────┐
      │  Gateway   │   │ Backend   │
      │  (Rust)    │   │  API      │
      ├────────────┤   ├───────────┤
      │ ENCRIPTA   │   │DESENCRIPTA│
      │ con clave  │   │ con clave │
      └────────────┘   └───────────┘
             │              ▲
             │              │
             ▼              │
      ┌──────────────────────────┐
      │    Smart Contract        │
      │  (Guarda datos           │
      │   ENCRIPTADOS)           │
      │  ❌ NO tiene la clave     │
      └──────────────────────────┘
                 │
                 ▼
         ┌──────────────┐
         │   Frontend   │
         │ ❌ NO tiene   │
         │   la clave   │
         └──────────────┘
```

**Regla de Oro de Seguridad:**
```
✅ Clave en Gateway (servidor, seguro)
✅ Clave en Backend API (servidor, seguro)
❌ Clave en Smart Contract (público, INSEGURO)
❌ Clave en Frontend (público, INSEGURO)
```

---

## 🔑 Glosario de Términos

### Términos de Criptografía

**AES-256-GCM**
- Algoritmo de encriptación simétrica muy seguro
- 256 = tamaño de la clave en bits
- GCM = modo que agrega autenticación

**Nonce**
- "Number used once" (número usado una vez)
- 12 bytes aleatorios
- Necesario para desencriptar
- Diferente para cada mensaje

**Ciphertext**
- Texto encriptado (ilegible)
- Resultado de aplicar AES-256-GCM
- Solo se puede desencriptar con la clave correcta + nonce

**Plaintext**
- Texto plano (legible)
- Los datos originales antes de encriptar

**Signature (Firma)**
- Hash SHA-256 de los datos encriptados
- Sirve para verificar integridad
- 32 bytes de longitud

**ENCRYPTION_KEY**
- Clave secreta para encriptar/desencriptar
- 64 caracteres hexadecimales (32 bytes)
- DEBE mantenerse secreta

### Términos de IoT

**MQTT**
- Message Queuing Telemetry Transport
- Protocolo ligero para dispositivos IoT
- Funciona con "broker" y "topics"

**Broker**
- Servidor central de MQTT
- Distribuye mensajes entre publicadores y suscriptores
- En este proyecto: broker.hivemq.com

**Topic**
- Canal de comunicación en MQTT
- Ejemplo: `bae/sensors/ESP32-001/data`
- Soporta wildcards: `bae/sensors/+/data`

**QoS (Quality of Service)**
- Nivel de garantía de entrega
- QoS 0: A lo mucho una vez (no garantizado)
- QoS 1: Al menos una vez (usado en este proyecto)
- QoS 2: Exactamente una vez

### Términos de Blockchain

**Smart Contract**
- Programa que corre en blockchain
- Inmutable (no se puede cambiar)
- Almacena datos permanentemente

**Transaction (TX)**
- Operación en blockchain
- Cuesta "gas" (fee)
- Tarda 10-30 segundos en confirmarse

**Block**
- Grupo de transacciones
- Cada ~12 segundos se crea uno nuevo
- Contiene hash del bloque anterior (cadena)

**Gas**
- Costo de ejecutar operaciones en blockchain
- Se paga en la moneda nativa (PAS en Paseo)
- Gas usado ≈ 150,000 por lectura

**RPC (Remote Procedure Call)**
- URL para conectarse a la blockchain
- Ejemplo: https://testnet-passet-hub-eth-rpc.polkadot.io

### Términos del Proyecto

**Gateway**
- Intermediario entre sensor y blockchain
- Escrito en Rust
- Responsable de encriptar y enviar

**Backend API**
- Servidor Node.js/Express
- Desencripta datos para el frontend
- Expone endpoints REST

**Reading**
- Una lectura del sensor
- Contiene temperatura, humedad, timestamp
- Se guarda encriptada en blockchain

**Device ID**
- Identificador del sensor
- Ejemplo: "ESP32-001"
- Permite distinguir múltiples sensores

---

## 💡 Preguntas Técnicas Frecuentes

### ¿Por qué Rust para Gateway y Sensor?

**Respuesta:**
- ✅ **Rendimiento**: Rust es muy rápido (comparable a C++)
- ✅ **Seguridad**: El compilador previene errores de memoria
- ✅ **Concurrencia**: Maneja múltiples tareas simultáneas sin problemas
- ✅ **Criptografía**: Excelentes bibliotecas para AES-256-GCM
- ✅ **IoT**: Ideal para dispositivos con recursos limitados

### ¿Por qué Node.js para el Backend API?

**Respuesta:**
- ✅ **Rapidez de desarrollo**: JavaScript/TypeScript es rápido de escribir
- ✅ **Ecosistema**: Muchas librerías para crypto y blockchain
- ✅ **Frontend familiar**: Mismo lenguaje que el frontend
- ✅ **JSON nativo**: Maneja JSON sin conversiones
- ✅ **Asíncrono**: Perfecto para I/O (requests HTTP, blockchain)

### ¿Por qué no desencriptar en el Smart Contract?

**Respuesta:**
- ❌ **Todo es público**: El código del contrato es visible
- ❌ **La clave sería visible**: Cualquiera podría verla
- ❌ **Costoso**: Desencriptar en blockchain costaría mucho gas
- ❌ **Lento**: Las operaciones criptográficas son lentas on-chain
- ✅ **Mejor**: Guardar encriptado y desencriptar off-chain

### ¿Qué pasa si alguien hackea el smart contract?

**Respuesta:**
- ✅ Los datos están **encriptados**
- ✅ El atacante solo vería: `0x8a3f2e1b...`
- ✅ Sin la ENCRYPTION_KEY, no puede desencriptar
- ✅ Los datos siguen **seguros**
- ⚠️ Pero podría bloquear nuevas escrituras

### ¿Puedo recuperar datos si pierdo la ENCRYPTION_KEY?

**Respuesta:**
- ❌ **NO**: Sin la clave, los datos son irrecuperables
- ❌ Es como perder la contraseña de tu billetera Bitcoin
- ✅ **Solución**: Hacer backup de la clave en múltiples lugares seguros
- ✅ Usar un gestor de secretos (AWS Secrets Manager, etc.)

### ¿Por qué MQTT y no HTTP directo?

**Respuesta:**

**MQTT ventajas:**
- ✅ Más eficiente para IoT
- ✅ Maneja desconexiones automáticamente
- ✅ Menor consumo de batería
- ✅ Soporta QoS (garantías de entrega)
- ✅ Pub/Sub pattern (escalable)

**HTTP desventajas para IoT:**
- ❌ Más overhead (headers, cookies, etc.)
- ❌ No mantiene conexión persistente
- ❌ Mayor consumo de batería
- ❌ Más complejo manejar reconexiones

### ¿Cuántos sensores puede manejar el sistema?

**Respuesta:**
- **Gateway**: ~1000 sensores simultáneos
- **MQTT Broker**: Millones de conexiones
- **Blockchain**: Limitado por gas y tiempo de bloque
- **Backend API**: Depende del servidor (escala horizontalmente)

**Optimizaciones posibles:**
- Batch de múltiples lecturas en una TX
- Usar Layer 2 para más velocidad
- Comprimir datos antes de encriptar

---

## 🎓 Para Desarrolladores Frontend

### Lo que DEBES saber:

1. ✅ Los datos en blockchain están **encriptados**
2. ✅ El Backend API es **obligatorio** para ver temperatura/humedad
3. ✅ Usa los hooks proporcionados (`useLatestReading`, etc.)
4. ✅ Los endpoints REST son **simples** y devuelven JSON
5. ✅ No necesitas entender blockchain o criptografía

### Lo que NO necesitas hacer:

1. ❌ Conectar directamente a blockchain
2. ❌ Desencriptar datos
3. ❌ Manejar claves privadas
4. ❌ Entender MQTT
5. ❌ Preocuparte por gas fees

### Tu trabajo es:

1. ✅ Llamar al Backend API
2. ✅ Mostrar los datos en la UI
3. ✅ Manejar loading/error states
4. ✅ Hacer la interfaz bonita y usable
5. ✅ Agregar gráficas y visualizaciones

### Endpoints que usarás:

```bash
# Los únicos endpoints que necesitas:
GET /api/readings/latest/decrypt    # Última lectura
GET /api/readings/history           # Historial
GET /api/readings/stats             # Estadísticas
GET /api/readings/count             # Total
```

**Eso es todo!** El resto es magia que pasa en el backend. 🪄

---

## 🎉 Conclusión Final

Este sistema es un **pipeline completo** desde un sensor físico hasta una interfaz web:

```
Sensor (Rust) 
  → MQTT 
    → Gateway (Rust, encripta) 
      → Blockchain (almacena encriptado)
        → Backend API (Node.js, desencripta)
          → Frontend (Next.js, muestra)
```

**Ventajas del diseño:**
- ✅ Datos seguros (encriptados)
- ✅ Inmutables (blockchain)
- ✅ Escalable (añadir sensores fácilmente)
- ✅ Auditable (todo registro

✅ Ver temperatura y humedad reales
✅ Ver historial completo desencriptado
✅ Ver estadísticas (promedios, alertas)
✅ Ver lecturas específicas por índice
✅ Hacer gráficas con datos reales
✅ Mostrar alertas de temperatura

### Lo que el frontend NO puede hacer:

❌ Desencriptar datos por sí solo (requiere el backend)
❌ Acceder directamente a la blockchain (usa el backend como intermediario)
❌ Ver la clave de encriptación (está oculta en el backend)

### URLs Importantes

```
Backend Local:      http://localhost:3001
Backend Producción: https://bae-backend-api.onrender.com
Blockchain RPC:     https://testnet-passet-hub-eth-rpc.polkadot.io
Contract:           0xfD0b399898efC0186E32eb81B630d7Cf7Bb6f217
Explorer:           https://blockscout-passet-hub.parity-testnet.parity.io
```

### Endpoints Principales

```
GET  /health                              → Health check
GET  /api/readings/latest/decrypt         → Última lectura
GET  /api/readings/:index/decrypt         → Lectura específica
GET  /api/readings/history?limit=X        → Historial
GET  /api/readings/count                  → Total
GET  /api/readings/stats?limit=X          → Estadísticas
```

---

## 🎓 Preguntas Frecuentes

### ¿Por qué no desencriptar en el frontend?

**Respuesta:** La clave de encriptación debe mantenerse **secreta**. Si la ponemos en el frontend:
- Cualquiera puede verla en el código del navegador
- Pueden desencriptar TODOS los datos históricos
- Es un riesgo de seguridad

### ¿Los datos en blockchain están seguros?

**Respuesta:** Sí, están **encriptados**. Alguien puede ver:
- Que hay datos guardados
- Cuándo se guardaron
- El device ID

Pero **NO** pueden ver:
- La temperatura
- La humedad
- Ningún dato sensible

### ¿Qué pasa si el backend se cae?

**Respuesta:** 
- Los datos siguen **seguros** en blockchain
- El frontend no podrá ver datos desencriptados temporalmente
- Cuando el backend vuelva, todo funciona normal
- Los datos NO se pierden

### ¿Puedo ver datos históricos de hace meses?

**Respuesta:** Sí, todos los datos están en blockchain permanentemente. Usa:
```typescript
// Ver lectura antigua (ejemplo: índice 0)
const { data } = useReading(0);
```

### ¿Cómo sé cuántas lecturas hay en total?

**Respuesta:** 
```typescript
const { data } = useReadingCount();
console.log(data.total); // Ejemplo: 1500
```

### ¿Puedo obtener TODAS las lecturas de una vez?

**Respuesta:** Técnicamente sí, pero:
- Límite por request: 100
- Recomendado: Paginación
- Para todo: Usar `useAllReadings()` que hace paginación automática

---

## 🎉 Conclusión

El Backend API es el **puente** entre el frontend y la blockchain que:

1. ✅ Lee datos encriptados de blockchain
2. ✅ Los desencripta de forma segura
3. ✅ Expone endpoints REST simples
4. ✅ Permite al frontend mostrar temperatura y humedad reales
5. ✅ Calcula estadísticas útiles
6. ✅ Maneja paginación para historial grande

**Todo lo que el frontend necesita:**
- Usar los hooks proporcionados
- Llamar a los endpoints REST
- Mostrar los datos en la UI

**Lo que el frontend NO necesita preocuparse:**
- Cómo funciona la encriptación
- Cómo conectar con blockchain
- Dónde está la clave secreta
- Cómo desencriptar los datos

---

**¿Preguntas?** El equipo de backend está disponible para ayudar. 🚀
