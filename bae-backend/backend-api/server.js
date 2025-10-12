// backend-api/server.js
import express from 'express';
import cors from 'cors';
import { ethers } from 'ethers';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// ============================================
// MIDDLEWARE - CORS MEJORADO
// ============================================
const allowedOrigins = [
  'http://localhost:3000',
  'https://bae-frontend-plum.vercel.app'
];

app.use(cors({
  origin: function(origin, callback) {
    // Permitir requests sin origin (Postman, curl, mobile apps, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('❌ CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Configuración de blockchain
const RPC_URL = process.env.RPC_URL;
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

// ABI del contrato
const CONTRACT_ABI = [
  {
    type: 'function',
    name: 'getLatestReading',
    stateMutability: 'view',
    inputs: [],
    outputs: [
      {
        type: 'tuple',
        components: [
          { name: 'deviceId', type: 'string' },
          { name: 'ciphertext', type: 'bytes' },
          { name: 'nonce', type: 'bytes' },
          { name: 'signature', type: 'bytes' },
          { name: 'timestamp', type: 'uint256' },
          { name: 'blockNumber', type: 'uint256' },
        ],
      },
    ],
  },
  {
    type: 'function',
    name: 'totalReadings',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'getReading',
    stateMutability: 'view',
    inputs: [{ name: 'index', type: 'uint256' }],
    outputs: [
      {
        type: 'tuple',
        components: [
          { name: 'deviceId', type: 'string' },
          { name: 'ciphertext', type: 'bytes' },
          { name: 'nonce', type: 'bytes' },
          { name: 'signature', type: 'bytes' },
          { name: 'timestamp', type: 'uint256' },
          { name: 'blockNumber', type: 'uint256' },
        ],
      },
    ],
  },
];

// Inicializar provider y contrato
const provider = new ethers.JsonRpcProvider(RPC_URL);
const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

// ============================================
// FUNCIÓN DE DESENCRIPTACIÓN
// ============================================
function decryptData(ciphertextHex, nonceHex, key) {
  try {
    // Convertir hex a buffer
    const ciphertext = Buffer.from(ciphertextHex.slice(2), 'hex');
    const nonce = Buffer.from(nonceHex.slice(2), 'hex');
    const keyBuffer = Buffer.from(key, 'hex');

    // Crear decipher
    const decipher = crypto.createDecipheriv('aes-256-gcm', keyBuffer, nonce);

    // Extraer authTag (últimos 16 bytes del ciphertext)
    const authTag = ciphertext.slice(-16);
    const encrypted = ciphertext.slice(0, -16);

    decipher.setAuthTag(authTag);

    // Desencriptar
    let decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    // Parsear JSON
    return JSON.parse(decrypted.toString('utf8'));
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data: ' + error.message);
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================
function formatReading(reading, decryptedData) {
  return {
    deviceId: reading.deviceId,
    temperature: decryptedData.temperature,
    humidity: decryptedData.humidity,
    timestamp: decryptedData.timestamp,
    timestampDate: new Date(decryptedData.timestamp * 1000).toISOString(),
    blockNumber: Number(reading.blockNumber),
  };
}

// ============================================
// ROUTES
// ============================================

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// GET /api/test - Endpoint de prueba mejorado
app.get('/api/test', async (req, res) => {
  try {
    const totalReadings = await contract.totalReadings();
    
    res.json({
      status: 'ok',
      message: 'API is working correctly',
      blockchain: {
        connected: true,
        contractAddress: CONTRACT_ADDRESS,
        totalReadings: Number(totalReadings)
      },
      cors: {
        allowedOrigins: allowedOrigins
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Blockchain connection failed',
      error: error.message
    });
  }
});

// GET /api/readings/latest/decrypt
// Obtener última lectura desencriptada
app.get('/api/readings/latest/decrypt', async (req, res) => {
  try {
    console.log('📥 Fetching latest reading...');

    // 1. Obtener datos del contrato
    const reading = await contract.getLatestReading();

    console.log('📦 Reading obtained from blockchain:', {
      deviceId: reading.deviceId,
      timestamp: Number(reading.timestamp),
      blockNumber: Number(reading.blockNumber),
    });

    // 2. Desencriptar
    const decryptedData = decryptData(
      reading.ciphertext,
      reading.nonce,
      ENCRYPTION_KEY
    );

    console.log('🔓 Data decrypted successfully');

    // 3. Formatear y responder
    const response = formatReading(reading, decryptedData);

    res.json(response);
  } catch (error) {
    console.error('❌ Error in /api/readings/latest/decrypt:', error);
    res.status(500).json({
      error: 'Failed to fetch and decrypt latest reading',
      message: error.message,
    });
  }
});

// GET /api/readings/:index/decrypt
// Obtener lectura específica desencriptada
app.get('/api/readings/:index/decrypt', async (req, res) => {
  try {
    const { index } = req.params;
    const readingIndex = parseInt(index, 10);

    if (isNaN(readingIndex) || readingIndex < 0) {
      return res.status(400).json({ error: 'Invalid index parameter' });
    }

    console.log(`📥 Fetching reading at index ${readingIndex}...`);

    // 1. Verificar que el índice existe
    const totalReadings = await contract.totalReadings();
    if (readingIndex >= Number(totalReadings)) {
      return res.status(404).json({
        error: 'Reading not found',
        message: `Index ${readingIndex} is out of range. Total readings: ${totalReadings}`,
      });
    }

    // 2. Obtener datos del contrato
    const reading = await contract.getReading(readingIndex);

    // 3. Desencriptar
    const decryptedData = decryptData(
      reading.ciphertext,
      reading.nonce,
      ENCRYPTION_KEY
    );

    console.log(`🔓 Reading ${readingIndex} decrypted successfully`);

    // 4. Formatear y responder
    const response = formatReading(reading, decryptedData);

    res.json(response);
  } catch (error) {
    console.error(`❌ Error in /api/readings/${req.params.index}/decrypt:`, error);
    res.status(500).json({
      error: 'Failed to fetch and decrypt reading',
      message: error.message,
    });
  }
});

// GET /api/readings/history
// Obtener historial de lecturas desencriptadas
app.get('/api/readings/history', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 50;
    const offset = parseInt(req.query.offset, 10) || 0;

    if (limit < 1 || limit > 100) {
      return res.status(400).json({ error: 'Limit must be between 1 and 100' });
    }

    console.log(`📥 Fetching history: limit=${limit}, offset=${offset}`);

    // 1. Obtener total de lecturas
    const totalReadings = await contract.totalReadings();
    const total = Number(totalReadings);

    if (total === 0) {
      return res.json({
        readings: [],
        total: 0,
        limit,
        offset,
      });
    }

    // 2. Calcular rango (más recientes primero)
    const startIndex = Math.max(0, total - offset - limit);
    const endIndex = Math.max(0, total - offset);
    const count = endIndex - startIndex;

    console.log(`📊 Fetching indices ${startIndex} to ${endIndex - 1} (total: ${total})`);

    // 3. Obtener y desencriptar lecturas
    const readings = [];
    for (let i = endIndex - 1; i >= startIndex; i--) {
      try {
        const reading = await contract.getReading(i);
        const decryptedData = decryptData(
          reading.ciphertext,
          reading.nonce,
          ENCRYPTION_KEY
        );
        readings.push(formatReading(reading, decryptedData));
      } catch (error) {
        console.error(`⚠️ Failed to decrypt reading ${i}:`, error.message);
        // Continuar con las demás lecturas
      }
    }

    console.log(`✅ Successfully fetched ${readings.length} readings`);

    res.json({
      readings,
      total,
      limit,
      offset,
      returned: readings.length,
    });
  } catch (error) {
    console.error('❌ Error in /api/readings/history:', error);
    res.status(500).json({
      error: 'Failed to fetch history',
      message: error.message,
    });
  }
});

// GET /api/readings/count
// Obtener total de lecturas
app.get('/api/readings/count', async (req, res) => {
  try {
    const totalReadings = await contract.totalReadings();
    res.json({ total: Number(totalReadings) });
  } catch (error) {
    console.error('❌ Error in /api/readings/count:', error);
    res.status(500).json({
      error: 'Failed to get reading count',
      message: error.message,
    });
  }
});

// GET /api/readings/stats
// Obtener estadísticas de lecturas
app.get('/api/readings/stats', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 20;

    console.log(`📊 Calculating stats for last ${limit} readings...`);

    // 1. Obtener total
    const totalReadings = await contract.totalReadings();
    const total = Number(totalReadings);

    if (total === 0) {
      return res.json({
        total: 0,
        avgTemperature: 0,
        avgHumidity: 0,
        minTemperature: 0,
        maxTemperature: 0,
        hotAlerts: 0,
        coldAlerts: 0,
      });
    }

    // 2. Obtener últimas N lecturas
    const startIndex = Math.max(0, total - limit);
    const temperatures = [];
    const humidities = [];
    let hotAlerts = 0;
    let coldAlerts = 0;

    for (let i = startIndex; i < total; i++) {
      try {
        const reading = await contract.getReading(i);
        const decryptedData = decryptData(
          reading.ciphertext,
          reading.nonce,
          ENCRYPTION_KEY
        );

        temperatures.push(decryptedData.temperature);
        humidities.push(decryptedData.humidity);

        if (decryptedData.temperature > 29) hotAlerts++;
        if (decryptedData.temperature < 17) coldAlerts++;
      } catch (error) {
        console.error(`⚠️ Failed to process reading ${i}:`, error.message);
      }
    }

    // 3. Calcular estadísticas
    const avgTemperature = temperatures.reduce((a, b) => a + b, 0) / temperatures.length;
    const avgHumidity = humidities.reduce((a, b) => a + b, 0) / humidities.length;
    const minTemperature = Math.min(...temperatures);
    const maxTemperature = Math.max(...temperatures);

    console.log('✅ Stats calculated successfully');

    res.json({
      total,
      analyzed: temperatures.length,
      avgTemperature: parseFloat(avgTemperature.toFixed(1)),
      avgHumidity: parseFloat(avgHumidity.toFixed(1)),
      minTemperature: parseFloat(minTemperature.toFixed(1)),
      maxTemperature: parseFloat(maxTemperature.toFixed(1)),
      hotAlerts,
      coldAlerts,
    });
  } catch (error) {
    console.error('❌ Error in /api/readings/stats:', error);
    res.status(500).json({
      error: 'Failed to calculate stats',
      message: error.message,
    });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('💥 Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
  });
});

// ============================================
// START SERVER
// ============================================
app.listen(PORT, () => {
  console.log('🚀 Backend API Server Started');
  console.log('================================');
  console.log(`📡 Server: http://localhost:${PORT}`);
  console.log(`🔗 RPC: ${RPC_URL}`);
  console.log(`📝 Contract: ${CONTRACT_ADDRESS}`);
  console.log(`🌐 CORS Origins: ${allowedOrigins.join(', ')}`);
  console.log('================================');
  console.log('Available endpoints:');
  console.log('  GET /health');
  console.log('  GET /api/test');
  console.log('  GET /api/readings/latest/decrypt');
  console.log('  GET /api/readings/:index/decrypt');
  console.log('  GET /api/readings/history?limit=50&offset=0');
  console.log('  GET /api/readings/count');
  console.log('  GET /api/readings/stats?limit=20');
  console.log('================================');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('👋 SIGINT received, shutting down gracefully...');
  process.exit(0);
});