# 🎨 Frontend Integration Guide

Guía completa para integrar el frontend con el sistema Bae IoT.

## 🚀 Quick Start

### 1. Instalación de dependencias

```bash
# Con npm
npm install ethers@6

# Con yarn
yarn add ethers@6

# Con pnpm
pnpm add ethers@6
```

### 2. Configuración básica

Crea un archivo `config.js`:

```javascript
export const CONFIG = {
  RPC_URL: 'https://testnet-passet-hub-eth-rpc.polkadot.io',
  CONTRACT_ADDRESS: '0xfD0b399898efC0186E32eb81B630d7Cf7Bb6f217',
  CHAIN_ID: 420420422,
  EXPLORER_URL: 'https://blockscout-passet-hub.parity-testnet.parity.io',
};
```

## 📝 Contract ABI

Crea `contractABI.js`:

```javascript
export const SENSOR_REGISTRY_ABI = [
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
        "internalType": "struct BaeSensorRegistry.SensorData",
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
    "inputs": [],
    "name": "totalReadings",
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
        "internalType": "struct BaeSensorRegistry.SensorData",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"name": "", "type": "uint256"}],
    "name": "allReadings",
    "outputs": [
      {"name": "deviceId", "type": "string"},
      {"name": "ciphertext", "type": "bytes"},
      {"name": "nonce", "type": "bytes"},
      {"name": "signature", "type": "bytes"},
      {"name": "timestamp", "type": "uint256"},
      {"name": "blockNumber", "type": "uint256"}
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
];
```

## 🔌 Servicio de Blockchain

Crea `blockchain.service.js`:

```javascript
import { ethers } from 'ethers';
import { CONFIG } from './config';
import { SENSOR_REGISTRY_ABI } from './contractABI';

class BlockchainService {
  constructor() {
    this.provider = new ethers.JsonRpcProvider(CONFIG.RPC_URL);
    this.contract = new ethers.Contract(
      CONFIG.CONTRACT_ADDRESS,
      SENSOR_REGISTRY_ABI,
      this.provider
    );
  }

  // Obtener la última lectura
  async getLatestReading() {
    try {
      const reading = await this.contract.getLatestReading();
      return this.formatReading(reading);
    } catch (error) {
      console.error('Error getting latest reading:', error);
      throw error;
    }
  }

  // Obtener el total de lecturas
  async getTotalReadings() {
    try {
      const count = await this.contract.totalReadings();
      return Number(count);
    } catch (error) {
      console.error('Error getting total readings:', error);
      throw error;
    }
  }

  // Obtener una lectura específica por índice
  async getReading(index) {
    try {
      const reading = await this.contract.getReading(index);
      return this.formatReading(reading);
    } catch (error) {
      console.error(`Error getting reading at index ${index}:`, error);
      throw error;
    }
  }

  // Obtener múltiples lecturas (paginación)
  async getReadings(startIndex, count = 10) {
    try {
      const total = await this.getTotalReadings();
      const endIndex = Math.min(startIndex + count, total);
      const readings = [];

      for (let i = startIndex; i < endIndex; i++) {
        const reading = await this.getReading(i);
        readings.push(reading);
      }

      return readings;
    } catch (error) {
      console.error('Error getting readings:', error);
      throw error;
    }
  }

  // Obtener las últimas N lecturas
  async getLatestReadings(count = 10) {
    try {
      const total = await this.getTotalReadings();
      const startIndex = Math.max(0, total - count);
      return this.getReadings(startIndex, count);
    } catch (error) {
      console.error('Error getting latest readings:', error);
      throw error;
    }
  }

  // Escuchar eventos en tiempo real
  onNewReading(callback) {
    this.contract.on('SensorDataSubmitted', (deviceId, timestamp, blockNumber, index) => {
      callback({
        deviceId,
        timestamp: new Date(Number(timestamp) * 1000),
        blockNumber: Number(blockNumber),
        index: Number(index)
      });
    });
  }

  // Detener escucha de eventos
  removeAllListeners() {
    this.contract.removeAllListeners('SensorDataSubmitted');
  }

  // Formatear lectura para uso en frontend
  formatReading(reading) {
    return {
      deviceId: reading.deviceId,
      ciphertext: reading.ciphertext,
      nonce: reading.nonce,
      signature: reading.signature,
      timestamp: Number(reading.timestamp),
      timestampDate: new Date(Number(reading.timestamp) * 1000),
      blockNumber: Number(reading.blockNumber),
      // Nota: Los datos están encriptados
      // Para desencriptarlos necesitas la clave (backend)
      encrypted: true
    };
  }

  // Obtener link al explorer
  getExplorerLink(type, value) {
    const baseUrl = CONFIG.EXPLORER_URL;
    switch(type) {
      case 'tx':
        return `${baseUrl}/tx/${value}`;
      case 'address':
        return `${baseUrl}/address/${value}`;
      case 'block':
        return `${baseUrl}/block/${value}`;
      default:
        return baseUrl;
    }
  }
}

export default new BlockchainService();
```

## ⚛️ React Hooks

Crea `useBlockchain.js`:

```javascript
import { useState, useEffect } from 'react';
import BlockchainService from './blockchain.service';

// Hook para obtener la última lectura
export function useLatestReading() {
  const [reading, setReading] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const data = await BlockchainService.getLatestReading();
        setReading(data);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
    
    // Actualizar cada 30 segundos
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  return { reading, loading, error };
}

// Hook para obtener el total de lecturas
export function useTotalReadings() {
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTotal() {
      try {
        const count = await BlockchainService.getTotalReadings();
        setTotal(count);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchTotal();
  }, []);

  return { total, loading };
}

// Hook para escuchar nuevas lecturas en tiempo real
export function useRealtimeReadings() {
  const [newReading, setNewReading] = useState(null);

  useEffect(() => {
    const handleNewReading = (reading) => {
      setNewReading(reading);
    };

    BlockchainService.onNewReading(handleNewReading);

    return () => {
      BlockchainService.removeAllListeners();
    };
  }, []);

  return newReading;
}

// Hook para obtener lecturas con paginación
export function useReadings(page = 0, pageSize = 10) {
  const [readings, setReadings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    async function fetchReadings() {
      try {
        setLoading(true);
        const startIndex = page * pageSize;
        const data = await BlockchainService.getReadings(startIndex, pageSize);
        setReadings(data);
        setHasMore(data.length === pageSize);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchReadings();
  }, [page, pageSize]);

  return { readings, loading, error, hasMore };
}
```

## 🎨 Componentes de UI (React)

### Dashboard Principal

```jsx
import React from 'react';
import { useLatestReading, useTotalReadings, useRealtimeReadings } from './useBlockchain';

function Dashboard() {
  const { reading, loading, error } = useLatestReading();
  const { total } = useTotalReadings();
  const newReading = useRealtimeReadings();

  // Mostrar notificación cuando hay nueva lectura
  useEffect(() => {
    if (newReading) {
      console.log('Nueva lectura recibida:', newReading);
      // Aquí puedes mostrar una notificación
    }
  }, [newReading]);

  if (loading) return <div>Cargando...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="dashboard">
      <h1>Bae IoT Dashboard</h1>
      
      <div className="stats">
        <div className="stat-card">
          <h3>Total de Lecturas</h3>
          <p className="stat-value">{total}</p>
        </div>
      </div>

      <div className="latest-reading">
        <h2>Última Lectura</h2>
        {reading && (
          <div className="reading-card">
            <p><strong>Device ID:</strong> {reading.deviceId}</p>
            <p><strong>Timestamp:</strong> {reading.timestampDate.toLocaleString()}</p>
            <p><strong>Block:</strong> {reading.blockNumber}</p>
            <p><strong>Estado:</strong> 🔐 Encriptado</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
```

### Lista de Lecturas

```jsx
import React, { useState } from 'react';
import { useReadings } from './useBlockchain';
import BlockchainService from './blockchain.service';

function ReadingsList() {
  const [page, setPage] = useState(0);
  const { readings, loading, error, hasMore } = useReadings(page, 20);

  return (
    <div className="readings-list">
      <h2>Historial de Lecturas</h2>
      
      {loading && <p>Cargando...</p>}
      {error && <p>Error: {error}</p>}
      
      <table>
        <thead>
          <tr>
            <th>Device ID</th>
            <th>Timestamp</th>
            <th>Block</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {readings.map((reading, index) => (
            <tr key={index}>
              <td>{reading.deviceId}</td>
              <td>{reading.timestampDate.toLocaleString()}</td>
              <td>
                <a 
                  href={BlockchainService.getExplorerLink('block', reading.blockNumber)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {reading.blockNumber}
                </a>
              </td>
              <td>🔐 Encriptado</td>
              <td>
                <button onClick={() => {/* Ver detalles */}}>
                  Ver
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="pagination">
        <button 
          onClick={() => setPage(p => Math.max(0, p - 1))}
          disabled={page === 0}
        >
          Anterior
        </button>
        <span>Página {page + 1}</span>
        <button 
          onClick={() => setPage(p => p + 1)}
          disabled={!hasMore}
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}

export default ReadingsList;
```

### Notificaciones en Tiempo Real

```jsx
import React, { useEffect } from 'react';
import { useRealtimeReadings } from './useBlockchain';
import { toast } from 'react-toastify'; // o tu librería de notificaciones

function RealtimeNotifications() {
  const newReading = useRealtimeReadings();

  useEffect(() => {
    if (newReading) {
      toast.info(
        `Nueva lectura de ${newReading.deviceId} a las ${newReading.timestamp.toLocaleTimeString()}`,
        {
          position: "top-right",
          autoClose: 5000,
        }
      );
    }
  }, [newReading]);

  return null; // Este componente no renderiza nada
}

export default RealtimeNotifications;
```

## 📊 Visualización de Datos

⚠️ **Importante:** Los datos están encriptados on-chain. Para mostrar temperaturas reales necesitas:

1. **Opción A:** Crear un endpoint en el backend que desencripte y devuelva los datos
2. **Opción B:** Almacenar datos desencriptados en una base de datos separada

### Ejemplo con datos mockeados (para diseño)

```jsx
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

function TemperatureChart() {
  // En producción, estos datos vendrían del backend desencriptados
  const mockData = [
    { timestamp: 1728421234, temperature: 23.5, humidity: 55.2 },
    { timestamp: 1728421264, temperature: 24.1, humidity: 54.8 },
    // ...más datos
  ];

  return (
    <div className="chart-container">
      <h3>Temperatura en Tiempo Real</h3>
      <LineChart width={800} height={400} data={mockData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="timestamp" 
          tickFormatter={(ts) => new Date(ts * 1000).toLocaleTimeString()}
        />
        <YAxis />
        <Tooltip 
          labelFormatter={(ts) => new Date(ts * 1000).toLocaleString()}
        />
        <Line 
          type="monotone" 
          dataKey="temperature" 
          stroke="#8884d8" 
          name="Temperatura (°C)"
        />
      </LineChart>
    </div>
  );
}
```

## 🔐 Backend API para Desencriptar (Recomendado)

Si quieres mostrar datos reales, necesitas un endpoint backend:

```javascript
// Ejemplo de endpoint Express.js
app.get('/api/readings/:index/decrypt', async (req, res) => {
  try {
    const { index } = req.params;
    
    // 1. Obtener datos del smart contract
    const reading = await contract.getReading(index);
    
    // 2. Desencriptar con la clave del backend
    const decryptedData = decrypt(
      reading.ciphertext,
      reading.nonce,
      process.env.ENCRYPTION_KEY
    );
    
    // 3. Devolver datos desencriptados
    res.json({
      deviceId: reading.deviceId,
      ...decryptedData, // { temperature, humidity, timestamp }
      blockNumber: reading.blockNumber
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

## 🎯 Features Recomendadas para el Frontend

1. **Dashboard principal**
   - Total de lecturas
   - Última lectura
   - Estado del sistema

2. **Gráficas en tiempo real**
   - Temperatura
   - Humedad
   - Histórico

3. **Alertas**
   - Temperatura alta (>29°C)
   - Temperatura baja (<17°C)
   - Notificaciones push

4. **Filtros y búsqueda**
   - Por device ID
   - Por rango de fechas
   - Por tipo de alerta

5. **Exportación**
   - CSV
   - JSON
   - PDF reports

6. **Autenticación** (opcional)
   - Login con wallet (MetaMask, WalletConnect)
   - Roles de usuario

## 🚀 Deploy del Frontend

### Vercel (Recomendado)

```bash
npm install -g vercel
vercel login
vercel
```

### Netlify

```bash
npm run build
# Sube la carpeta build/ a Netlify
```

### Variables de entorno

```env
VITE_RPC_URL=https://testnet-passet-hub-eth-rpc.polkadot.io
VITE_CONTRACT_ADDRESS=0xfD0b399898efC0186E32eb81B630d7Cf7Bb6f217
VITE_CHAIN_ID=420420422
```

## 📚 Recursos Adicionales

- **Ethers.js Docs:** https://docs.ethers.org/v6/
- **React Docs:** https://react.dev
- **Recharts:** https://recharts.org
- **BlockScout API:** https://blockscout-passet-hub.parity-testnet.parity.io/api-docs

## 🆘 Soporte

Si tienes preguntas sobre la integración:

1. Revisa los ejemplos de código
2. Consulta la documentación de ethers.js
3. Abre un issue en el repositorio
4. Contacta al equipo de Bae

---

**¡Buena suerte con el desarrollo del frontend!** 🚀
