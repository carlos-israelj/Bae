# Bae Backend - Paseo Hub Edition

Sistema IoT descentralizado con smart contracts en **Paseo Hub Testnet**.

## 🏗️ Arquitectura
Sensor → MQTT → Gateway → Smart Contract (Paseo Hub)
↓
Frontend (ethers.js/viem)

## 📦 Componentes

1. **Smart Contract** (`contracts/`) - Solidity en Paseo Hub
2. **Gateway** (`gateway/`) - Rust, escribe datos al contrato
3. **Sensor Simulator** (`sensor-simulator/`) - Genera datos de prueba

## 🚀 Quick Start

### 1. Desplegar Smart Contract
```bash
cd contracts
npm install
npm run compile
npm run deploy
# Guarda la dirección del contrato