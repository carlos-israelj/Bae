# 🌐 Bae IoT - Sistema IoT Descentralizado

Sistema IoT descentralizado que almacena datos encriptados de sensores en la blockchain de Polkadot (Paseo Hub Testnet).

## 🏗️ Arquitectura

```
┌─────────────────┐
│  ESP32 Sensor   │
│  (Simulator)    │
└────────┬────────┘
         │ MQTT (broker.hivemq.com)
         │ Topic: bae/sensors/+/data
         ▼
┌─────────────────┐
│   Rust Gateway  │
│  - AES-256-GCM  │
│  - SHA-256      │
└────────┬────────┘
         │ JSON-RPC
         │ (Paseo Hub)
         ▼
┌─────────────────┐
│ Smart Contract  │
│ BaeSensorRegistry│
│  (Solidity)     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Frontend      │
│  (ethers.js)    │
└─────────────────┘
```

## 📦 Componentes

### 1. **Smart Contract** (`contracts/`)
- **Lenguaje:** Solidity 0.8.28
- **Network:** Paseo Hub Testnet (Chain ID: 420420422)
- **Dirección:** `0xfD0b399898efC0186E32eb81B630d7Cf7Bb6f217`
- **Funciones principales:**
  - `submitSensorData()` - Almacena datos encriptados
  - `getLatestReading()` - Obtiene última lectura
  - `getReadingCount()` - Contador de lecturas
  - `getReading(index)` - Lectura por índice

### 2. **Sensor Simulator** (`sensor-simulator/`)
- **Lenguaje:** Rust
- **Función:** Simula un sensor ESP32 generando datos de temperatura y humedad
- **Protocolo:** MQTT
- **Frecuencia:** Cada 30 segundos
- **Alertas:**
  - 🥶 Frío: 15-17°C (10% probabilidad)
  - 🔥 Calor: 29-31°C (5% probabilidad)
  - ✅ Normal: 21-25°C (85% probabilidad)

### 3. **Gateway** (`gateway/`)
- **Lenguaje:** Rust
- **Función:** Middleware entre MQTT y Blockchain
- **Seguridad:**
  - Encriptación AES-256-GCM
  - Firma SHA-256
  - Validación de datos
- **Features:**
  - Retry logic (3 intentos)
  - Estadísticas en tiempo real
  - Reconexión automática

## 🔐 Seguridad

### Flujo de Encriptación:

```
Sensor Data (Plain) 
    ↓
AES-256-GCM Encryption
    ↓
SHA-256 Signature
    ↓
Smart Contract (On-chain)
```

### Datos Almacenados On-Chain:

```solidity
struct SensorData {
    string deviceId;      // "ESP32-001"
    bytes ciphertext;     // Datos encriptados (108 bytes aprox)
    bytes nonce;          // Nonce AES-GCM (12 bytes)
    bytes signature;      // Firma SHA-256 (32 bytes)
    uint256 timestamp;    // Unix timestamp
    uint256 blockNumber;  // Block de inclusión
}
```

## 🚀 Deployment

### Producción (Render.com)

**Gateway:**
- URL: https://bae-gateway.onrender.com
- Status: ✅ Running
- Logs: Dashboard de Render

**Sensor Simulator:**
- Status: ✅ Running
- Device ID: ESP32-001
- Interval: 30s

### Variables de Entorno

```bash
# Gateway
RUST_LOG=info
MQTT_BROKER=broker.hivemq.com
MQTT_PORT=1883
RPC_URL=https://testnet-passet-hub-eth-rpc.polkadot.io
CONTRACT_ADDRESS=0xfD0b399898efC0186E32eb81B630d7Cf7Bb6f217
PRIVATE_KEY=<your-private-key>
ENCRYPTION_KEY=<32-byte-hex-key>

# Sensor Simulator
RUST_LOG=info
MQTT_BROKER=broker.hivemq.com
MQTT_PORT=1883
DEVICE_ID=ESP32-001
INTERVAL_SECS=30
```

## 🔗 APIs y Endpoints

### Blockchain (JSON-RPC)

**Network:** Paseo Hub Testnet
```
RPC URL: https://testnet-passet-hub-eth-rpc.polkadot.io
Chain ID: 420420422
Explorer: https://blockscout-passet-hub.parity-testnet.parity.io
```

### Smart Contract ABI

```json
[
  {
    "inputs": [
      {"name": "deviceId", "type": "string"},
      {"name": "ciphertext", "type": "bytes"},
      {"name": "nonce", "type": "bytes"},
      {"name": "signature", "type": "bytes"},
      {"name": "timestamp", "type": "uint256"}
    ],
    "name": "submitSensorData",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getLatestReading",
    "outputs": [
      {
        "components": [
          {"name": "deviceId", "type": "string"},
          {"name": "ciphertext", "type": "bytes"},
          {"name": "nonce", "type": "bytes"},
          {"name": "signature", "type": "bytes"},
          {"name": "timestamp", "type": "uint256"},
          {"name": "blockNumber", "type": "uint256"}
        ],
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getReadingCount",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"name": "index", "type": "uint256"}],
    "name": "getReading",
    "outputs": [
      {
        "components": [
          {"name": "deviceId", "type": "string"},
          {"name": "ciphertext", "type": "bytes"},
          {"name": "nonce", "type": "bytes"},
          {"name": "signature", "type": "bytes"},
          {"name": "timestamp", "type": "uint256"},
          {"name": "blockNumber", "type": "uint256"}
        ],
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "name": "deviceId", "type": "string"},
      {"indexed": false, "name": "timestamp", "type": "uint256"},
      {"indexed": false, "name": "blockNumber", "type": "uint256"},
      {"indexed": false, "name": "index", "type": "uint256"}
    ],
    "name": "SensorDataSubmitted",
    "type": "event"
  }
]
```

## 💻 Frontend Integration

### Conectar con ethers.js

```javascript
import { ethers } from 'ethers';

// Configuración
const RPC_URL = 'https://testnet-passet-hub-eth-rpc.polkadot.io';
const CONTRACT_ADDRESS = '0xfD0b399898efC0186E32eb81B630d7Cf7Bb6f217';
const ABI = [ /* ABI del contrato */ ];

// Conectar al provider
const provider = new ethers.JsonRpcProvider(RPC_URL);
const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);

// Leer datos
async function getLatestReading() {
  try {
    const reading = await contract.getLatestReading();
    console.log('Device ID:', reading.deviceId);
    console.log('Timestamp:', new Date(Number(reading.timestamp) * 1000));
    console.log('Block:', Number(reading.blockNumber));
    return reading;
  } catch (error) {
    console.error('Error:', error);
  }
}

// Obtener total de lecturas
async function getTotalReadings() {
  const count = await contract.getReadingCount();
  return Number(count);
}

// Obtener lectura específica
async function getReading(index) {
  const reading = await contract.getReading(index);
  return reading;
}

// Escuchar eventos en tiempo real
contract.on('SensorDataSubmitted', (deviceId, timestamp, blockNumber, index) => {
  console.log('Nueva lectura:', {
    deviceId,
    timestamp: new Date(Number(timestamp) * 1000),
    blockNumber: Number(blockNumber),
    index: Number(index)
  });
});
```

### Desencriptar Datos (Frontend)

⚠️ **IMPORTANTE:** La clave de encriptación debe estar en el backend, NO en el frontend.

Para mostrar datos desencriptados en el frontend, considera:

**Opción A:** Crear un endpoint en el Gateway que desencripte y devuelva datos.

**Opción B:** Usar una API intermedia que maneje la desencriptación.

```javascript
// Ejemplo conceptual - NO USAR LA KEY EN FRONTEND
import CryptoJS from 'crypto-js';

async function decryptReading(ciphertext, nonce, key) {
  // Esta lógica debe estar en el BACKEND
  // Solo mostrar datos ya desencriptados
}
```

### Ejemplo de UI Components

```jsx
// React Component - Latest Reading
function LatestReading() {
  const [reading, setReading] = useState(null);
  
  useEffect(() => {
    async function fetchData() {
      const latest = await getLatestReading();
      setReading(latest);
    }
    fetchData();
    
    // Actualizar cada 30s
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);
  
  if (!reading) return <div>Cargando...</div>;
  
  return (
    <div className="reading-card">
      <h3>Última Lectura</h3>
      <p>Device: {reading.deviceId}</p>
      <p>Timestamp: {new Date(Number(reading.timestamp) * 1000).toLocaleString()}</p>
      <p>Block: {Number(reading.blockNumber)}</p>
      <p>Estado: 🔐 Encriptado</p>
    </div>
  );
}
```

### Gráficas en Tiempo Real

```javascript
// Usando Chart.js o Recharts
import { LineChart, Line, XAxis, YAxis } from 'recharts';

function TemperatureChart() {
  const [data, setData] = useState([]);
  
  useEffect(() => {
    async function loadHistory() {
      const count = await getTotalReadings();
      const readings = [];
      
      // Cargar últimas 50 lecturas
      const start = Math.max(0, count - 50);
      for (let i = start; i < count; i++) {
        const reading = await getReading(i);
        readings.push({
          timestamp: Number(reading.timestamp),
          // Nota: temperatura está encriptada
          // Necesitas desencriptar en backend
        });
      }
      
      setData(readings);
    }
    
    loadHistory();
  }, []);
  
  return (
    <LineChart width={800} height={400} data={data}>
      <XAxis dataKey="timestamp" />
      <YAxis />
      <Line type="monotone" dataKey="temperature" stroke="#8884d8" />
    </LineChart>
  );
}
```

## 📊 Datos de Ejemplo

### Lectura del Smart Contract

```json
{
  "deviceId": "ESP32-001",
  "ciphertext": "0x8a3f2e1b9c...",
  "nonce": "0x1a2b3c4d5e6f7g8h9i0j1k2l",
  "signature": "0x9f8e7d6c5b4a...",
  "timestamp": 1728421234,
  "blockNumber": 12345
}
```

### Datos Desencriptados (Backend)

```json
{
  "device_id": "ESP32-001",
  "temperature": 23.5,
  "humidity": 55.2,
  "timestamp": 1728421234
}
```

## 🧪 Testing

### Testear contrato localmente

```bash
cd contracts
npm test
```

### Testear Gateway localmente

```bash
cd gateway
RUST_LOG=info cargo run
```

### Testear Sensor localmente

```bash
cd sensor-simulator
RUST_LOG=info cargo run
```

## 🔍 Monitoreo

### Links importantes:

- **Contract Explorer:** https://blockscout-passet-hub.parity-testnet.parity.io/address/0xfD0b399898efC0186E32eb81B630d7Cf7Bb6f217
- **Gateway Wallet:** https://blockscout-passet-hub.parity-testnet.parity.io/address/0x648a3e5510f55b4995fa5a22ccd62e2586acb901
- **Render Dashboard:** https://dashboard.render.com

### Métricas clave:

- Total de lecturas: `contract.totalReadings()`
- Último timestamp: `contract.getLatestReading().timestamp`
- Balance de wallet: Ver en BlockScout
- Estado de servicios: Dashboard de Render

## 📚 Stack Tecnológico

- **Smart Contracts:** Solidity 0.8.28, Hardhat
- **Backend:** Rust, Tokio, ethers-rs
- **Encriptación:** AES-256-GCM, SHA-256
- **Blockchain:** Polkadot (Paseo Hub Testnet)
- **MQTT:** HiveMQ Cloud Broker
- **Deploy:** Render.com
- **Frontend:** React/Next.js + ethers.js (recomendado)

## 🤝 Contribuir

1. Fork el repositorio
2. Crea una rama: `git checkout -b feature/nueva-funcionalidad`
3. Commit: `git commit -m 'feat: agregar nueva funcionalidad'`
4. Push: `git push origin feature/nueva-funcionalidad`
5. Crea un Pull Request

## 📄 Licencia

Apache 2.0

## 👥 Equipo

Bae Team - Sistema IoT Descentralizado

---

**¿Preguntas?** Abre un issue en el repositorio.
