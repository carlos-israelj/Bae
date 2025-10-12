# BAE - Baby Ambient Environment

A decentralized IoT + Blockchain platform for neonatal environmental monitoring that ensures data traceability and privacy. Combines real-time sensor data, AES-256-GCM encryption, and Polkadot blockchain to protect babies' health information while enabling ethical research for medical institutions.

![Group 8](https://github.com/user-attachments/assets/ed43de96-512e-43f6-befc-4fcf5be27b2d)

## The Problem

In Latin America and the Caribbean, the PAHO estimates that **255 babies die every day before reaching one month of age**. This figure reflects a silent crisis during the neonatal period, when mortality risk is highest.

### Critical Statistics

* **57% of all infant deaths** in Latin America occur in the first 28 days of life
* Lack of accessible and reliable preventive monitoring solutions
* Absence of traceability in neonatal health data
* Limited options for vulnerable families

> "More than 57% of infant deaths in Latin America occur in the first 28 days of life. This evidences the urgency for a preventive, accessible, and reliable solution to reduce risk." — PAHO

## The Solution: BAE

BAE integrates Polkadot blockchain technology to ensure **traceability and privacy** of baby data. Every time the IoT sensor measures temperature or humidity, that information is transformed into an encrypted transaction recorded on the network in a decentralized way, guaranteeing it cannot be altered or manipulated.

### Key Features

* **Real-Time Monitoring**: Temperature and humidity readings every 30 seconds with instant alerts
* **End-to-End Encryption**: Sensor data encrypted with AES-256-GCM before transmission
* **Device Authentication**: Each device linked to a unique NFT certifying authenticity
* **Data Ownership**: Parents have total ownership and control of their data
* **Ethical Research**: Anonymous data can be shared ethically with universities/institutions
* **Blockchain Traceability**: Every reading is verifiable and immutable on Polkadot
* **Privacy-Preserving**: Encrypted data on-chain, only decrypted by authorized backend

## Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        BAE SYSTEM ARCHITECTURE                       │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────────┐
│   ESP32 Sensor   │  Temperature: 15-31°C
│   (Simulator)    │  Humidity: 40-80%
│                  │  Frequency: Every 30s
└────────┬─────────┘
         │
         │ MQTT Protocol
         │ Topic: bae/sensors/+/data
         │ Broker: broker.hivemq.com
         │
         ▼
┌──────────────────┐
│  Rust Gateway    │  ┌─────────────────────────────────┐
│                  │  │ Security Processing:            │
│  - Validates     │  │ 1. Validate sensor data         │
│  - Encrypts      │  │ 2. AES-256-GCM Encryption       │
│  - Signs         │  │ 3. SHA-256 Signature            │
│  - Submits       │  │ 4. Submit to blockchain         │
└────────┬─────────┘  └─────────────────────────────────┘
         │
         │ JSON-RPC
         │ Transaction to Polkadot
         │
         ▼
┌──────────────────────────────────────────────────────────────┐
│            POLKADOT PASEO HUB TESTNET                        │
│                                                              │
│  ┌────────────────────────────────────────────────────┐     │
│  │     Smart Contract: BaeSensorRegistry             │     │
│  │     Address: 0xfD0b...f217                        │     │
│  │                                                    │     │
│  │  Storage:                                         │     │
│  │  • Device ID                                      │     │
│  │  • Ciphertext (encrypted data)                    │     │
│  │  • Nonce (12 bytes)                               │     │
│  │  • Signature (32 bytes)                           │     │
│  │  • Timestamp                                      │     │
│  │  • Block Number                                   │     │
│  └────────────────────────────────────────────────────┘     │
│                                                              │
│  Features: Immutable • Transparent • Verifiable             │
└──────────────────┬───────────────────────────────────────────┘
                   │
       ┌───────────┴───────────┐
       │                       │
       ▼                       ▼
┌──────────────────┐    ┌──────────────────┐
│   Backend API    │    │    Frontend      │
│   (Node.js)      │    │   (Next.js 15)   │
│                  │    │                  │
│  • Reads chain   │    │  • Web3 wallet   │
│  • Decrypts AES  │◄───┤  • Dashboard     │
│  • REST API      │    │  • Alerts        │
│  • Stats calc.   │    │  • Charts        │
└──────────────────┘    └──────────────────┘
         │                       │
         │                       │
         ▼                       ▼
┌──────────────────────────────────────┐
│         END USERS                    │
│                                      │
│  👨‍👩‍👧 Parents    👨‍⚕️ Doctors    🔬 Researchers │
└──────────────────────────────────────┘
```

### Data Flow Diagram

```
┌────────────────────────────────────────────────────────────────────┐
│                         DATA FLOW PROCESS                           │
└────────────────────────────────────────────────────────────────────┘

STEP 1: DATA GENERATION
┌─────────────────────────┐
│   Sensor Reading        │
│                         │
│   Plain JSON:           │
│   {                     │
│     "device_id": "...", │
│     "temp": 23.5,       │
│     "humidity": 55.2    │
│   }                     │
│                         │
│   Status: ✅ READABLE   │
└───────────┬─────────────┘
            │
            ▼
STEP 2: ENCRYPTION
┌─────────────────────────┐
│   Gateway Processing    │
│                         │
│   AES-256-GCM:          │
│   Plain → Ciphertext    │
│                         │
│   SHA-256:              │
│   Generate Signature    │
│                         │
│   Status: 🔒 ENCRYPTED  │
└───────────┬─────────────┘
            │
            ▼
STEP 3: BLOCKCHAIN STORAGE
┌─────────────────────────┐
│   Smart Contract        │
│                         │
│   Stored Data:          │
│   • Ciphertext          │
│   • Nonce               │
│   • Signature           │
│   • Metadata            │
│                         │
│   Status: ⛓️ IMMUTABLE  │
└───────────┬─────────────┘
            │
            ▼
STEP 4: AUTHORIZED ACCESS
┌─────────────────────────┐
│   Backend Decryption    │
│                         │
│   Process:              │
│   1. Read from chain    │
│   2. Verify signature   │
│   3. Decrypt with key   │
│   4. Return JSON        │
│                         │
│   Status: ✅ READABLE   │
└───────────┬─────────────┘
            │
            ▼
STEP 5: VISUALIZATION
┌─────────────────────────┐
│   User Dashboard        │
│                         │
│   Display:              │
│   🌡️ Temperature: 23.5°C │
│   💧 Humidity: 55.2%     │
│   📊 Charts & Stats     │
│   ⚠️ Alerts             │
└─────────────────────────┘
```

### Security Architecture

```
┌────────────────────────────────────────────────────────────────────┐
│                       SECURITY LAYERS                               │
└────────────────────────────────────────────────────────────────────┘

Layer 1: SENSOR LEVEL
├─ Plain data generation
├─ Device authentication via NFT
└─ Secure MQTT transmission

Layer 2: GATEWAY LEVEL (Encryption)
├─ AES-256-GCM Encryption
│  ├─ Algorithm: Advanced Encryption Standard
│  ├─ Key Size: 256 bits (32 bytes)
│  ├─ Mode: Galois/Counter Mode
│  └─ Nonce: 12 random bytes per message
│
├─ SHA-256 Signature
│  ├─ Hash of encrypted data
│  ├─ Integrity verification
│  └─ 32 bytes output
│
└─ Retry logic (up to 3 attempts)

Layer 3: BLOCKCHAIN LEVEL (Storage)
├─ Immutable storage on Polkadot
├─ Transparent transaction history
├─ No decryption capability on-chain
├─ Public verification of signatures
└─ Event emission for real-time tracking

Layer 4: BACKEND LEVEL (Decryption)
├─ Authorized decryption only
├─ Encryption key stored server-side
├─ REST API access control
├─ Rate limiting
└─ Audit logging

Layer 5: FRONTEND LEVEL (Display)
├─ No sensitive keys exposed
├─ Web3 wallet authentication
├─ HTTPS/TLS encryption
├─ Client-side validation
└─ User permission management

┌────────────────────────────────────────┐
│     ENCRYPTION KEY DISTRIBUTION        │
├────────────────────────────────────────┤
│                                        │
│  Gateway (Rust)    ✅ HAS KEY         │
│  ├─ Encrypts data                     │
│  └─ Stored in env variables           │
│                                        │
│  Smart Contract    ❌ NO KEY          │
│  ├─ Only stores encrypted data        │
│  └─ Cannot decrypt                    │
│                                        │
│  Backend API       ✅ HAS KEY         │
│  ├─ Decrypts data                     │
│  └─ Stored in env variables           │
│                                        │
│  Frontend          ❌ NO KEY          │
│  ├─ Only displays decrypted data      │
│  └─ Cannot decrypt                    │
│                                        │
└────────────────────────────────────────┘
```

### Component Communication

```
┌────────────────────────────────────────────────────────────────────┐
│                    COMPONENT INTERACTIONS                           │
└────────────────────────────────────────────────────────────────────┘

┌──────────────┐                    ┌──────────────┐
│   Sensor     │──── MQTT Pub ────▶ │   Gateway    │
│   ESP32      │                    │   (Rust)     │
└──────────────┘                    └──────┬───────┘
                                           │
                                           │ JSON-RPC
                                           │ submitSensorData()
                                           │
                                           ▼
                              ┌────────────────────────┐
                              │   Smart Contract       │
                              │   (Solidity)           │
                              │                        │
                              │   Functions:           │
                              │   • submitSensorData() │
                              │   • getLatestReading() │
                              │   • getReading(index)  │
                              │   • totalReadings()    │
                              └───────┬────────────────┘
                                      │
                        ┌─────────────┴─────────────┐
                        │                           │
                        ▼                           │
              ┌──────────────────┐                  │
              │   Backend API    │                  │
              │   (Node.js)      │                  │
              │                  │                  │
              │   Endpoints:     │                  │
              │   GET /health    │                  │
              │   GET /latest    │◀─── Reads ───────┘
              │   GET /history   │      Chain
              │   GET /stats     │
              └─────────┬────────┘
                        │
                        │ REST API
                        │ JSON Response
                        │
                        ▼
              ┌──────────────────┐
              │    Frontend      │
              │    (Next.js)     │
              │                  │
              │   Components:    │
              │   • Dashboard    │
              │   • Charts       │
              │   • Alerts       │
              │   • History      │
              └──────────────────┘
```

### Alert System Flow

```
┌────────────────────────────────────────────────────────────────────┐
│                         ALERT SYSTEM                                │
└────────────────────────────────────────────────────────────────────┘

Temperature Reading
        │
        ▼
   ┌─────────┐
   │ Analyze │
   └────┬────┘
        │
        ├──────────────┬──────────────┬──────────────┐
        │              │              │              │
        ▼              ▼              ▼              ▼
   < 17°C         17-21°C        21-25°C        > 29°C
        │              │              │              │
        │              │              │              │
        ▼              ▼              ▼              ▼
┌──────────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐
│ 🥶 COLD ALERT│ │   COOL   │ │ ✅ NORMAL│ │ 🔥 HOT ALERT │
│              │ │          │ │          │ │              │
│ Hypothermia  │ │  Safe    │ │ Optimal  │ │ Hyperthermia │
│ Risk         │ │  Range   │ │ Range    │ │ Risk         │
│              │ │          │ │          │ │              │
│ Action:      │ │ Action:  │ │ Action:  │ │ Action:      │
│ • Alert      │ │ • Monitor│ │ • Monitor│ │ • Alert      │
│ • Notify     │ │          │ │          │ │ • Notify     │
│ • Log        │ │          │ │          │ │ • Log        │
└──────────────┘ └──────────┘ └──────────┘ └──────────────┘

Alert Distribution:
├─ 85% Normal Range (21-25°C)
├─ 10% Cold Alerts (<17°C)
└─  5% Hot Alerts (>29°C)
```

### Technical Architecture

**Components:**

* **Frontend**: Next.js 15 with Web3 wallet connection (RainbowKit + Wagmi)
* **Backend**: Node.js/Express with REST API for data decryption
* **Smart Contracts**: Solidity 0.8.28 on Polkadot Paseo Hub Testnet
* **Gateway**: Rust-based IoT gateway with AES-256-GCM encryption and SHA-256 signing
* **Sensor**: ESP32 simulator generating realistic neonatal environment data
* **Storage**: On-chain encrypted data with off-chain decryption capabilities

## Key Benefits

### For Parents
* Data sovereignty and complete control over baby's information
* Real-time alerts for abnormal temperature/humidity conditions
* Peace of mind with 24/7 monitoring
* Transparent and verifiable data history

### For Healthcare Providers
* Access to anonymized aggregate data for research
* Evidence-based insights for neonatal care protocols
* Compliance with privacy regulations
* Immutable audit trails

### For Researchers
* Ethical access to large-scale anonymous datasets
* Privacy-preserving analytics on encrypted data
* Contribution to reducing neonatal mortality
* Built-in data integrity verification

## MVP Capabilities

* **Environmental Monitoring**: Secure, encrypted temperature and humidity tracking
* **Real-Time Alerts**: Instant notifications for critical conditions (<17°C or >29°C)
* **Statistical Research**: Privacy-preserving analytics on encrypted datasets
* **Access Control**: Smart contract-based permission management
* **Data Ownership**: NFT-based device authentication and data ownership
* **Dashboard**: Real-time visualization with historical data and trends

## Roadmap

```
┌────────────────────────────────────────────────────────────────────┐
│                          BAE ROADMAP                                │
└────────────────────────────────────────────────────────────────────┘

Q1 2025: MVP LAUNCH
├─ Target Date: January 31, 2025
├─ Deliverables:
│  ├─ ✅ Encrypted sensor data upload
│  ├─ ✅ Smart contract deployment (Paseo Testnet)
│  ├─ ✅ Backend decryption API
│  ├─ ✅ Real-time dashboard with alerts
│  └─ ✅ Basic documentation
├─ Status: COMPLETED
└─ Metrics: 1 device, 10,000+ readings

Q2 2025: VALIDATION PHASE
├─ Target Date: March 31, 2025
├─ Deliverables:
│  ├─ End-to-end demo: sensor → blockchain → dashboard
│  ├─ Pilot program with 10 families
│  ├─ Basic audit logging
│  ├─ Compliance features (GDPR/HIPAA considerations)
│  └─ Mobile app prototype
├─ Status: IN PROGRESS
└─ Metrics: 10 devices, 3 partner families

Q3 2025: SCALE & PARTNERSHIPS
├─ Target Date: August 31, 2025
├─ Deliverables:
│  ├─ Expand to 100 devices
│  ├─ Role-based access control (RBAC)
│  ├─ Partnership with 5 hospitals
│  ├─ Research data platform for institutions
│  ├─ Advanced analytics dashboard
│  └─ Multi-language support (ES/EN/PT)
├─ Status: PLANNED
└─ Metrics: 100 devices, 5 hospital partners

Q4 2025+: PRODUCTION & MAINNET
├─ Target Date: December 31, 2025
├─ Deliverables:
│  ├─ Mainnet deployment (Polkadot)
│  ├─ Multi-device support per household
│  ├─ ML-based predictive analytics
│  ├─ Integration with healthcare systems (HL7/FHIR)
│  ├─ Hardware production & distribution
│  └─ Grant funding secured
├─ Status: PLANNED
└─ Metrics: 1,000+ devices, 50+ institutions

2026: REGIONAL EXPANSION
├─ Target: Full Latin America coverage
├─ Goals:
│  ├─ 10,000 devices deployed
│  ├─ 100 partner institutions
│  ├─ 5% reduction in neonatal deaths (pilot areas)
│  └─ 100+ research papers using BAE data
└─ Status: VISION
```

## Business Model

```
┌────────────────────────────────────────────────────────────────────┐
│                       REVENUE STREAMS                               │
└────────────────────────────────────────────────────────────────────┘

1. DEVICE SALES
   ├─ Hardware: ESP32 sensor units
   ├─ Target Price: $50-80 USD per device
   ├─ Launch: February 2025
   ├─ Focus: Low-cost for vulnerable communities
   └─ Revenue Share: 40%

2. SUBSCRIPTION SERVICE
   ├─ Monthly monitoring & data storage
   ├─ Tiers:
   │  ├─ Basic: $5/month (1 device, 30 days history)
   │  ├─ Family: $10/month (3 devices, 90 days history)
   │  └─ Premium: $20/month (5 devices, unlimited history + alerts)
   ├─ Beta: March 2025
   ├─ General Availability: May 2025
   └─ Revenue Share: 35%

3. RESEARCH LICENSING
   ├─ Anonymous data access for institutions
   ├─ Pricing:
   │  ├─ University: $500/month (10k records/month)
   │  ├─ Hospital: $1,500/month (50k records/month)
   │  └─ Pharmaceutical: $5,000/month (unlimited)
   ├─ Launch: June 2025
   ├─ Compliance: Full ethical research standards
   └─ Revenue Share: 20%

4. GRANT FUNDING
   ├─ Public health organizations
   ├─ Applications: Q1 2025
   ├─ Focus: Latin American initiatives
   ├─ Target: $500k-1M in grants (2025)
   └─ Revenue Share: 5%

┌────────────────────────────────────────────────────────────────────┐
│                     PRICING STRATEGY                                │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  Hardware (One-time):        $50-80 USD                           │
│  Subscription (Monthly):     $5-20 USD                            │
│  Research License (Monthly): $500-5,000 USD                       │
│                                                                    │
│  Total Addressable Market:                                        │
│  ├─ Latin America: 10M+ births/year                              │
│  ├─ High-risk neonates: ~1.5M/year                               │
│  └─ Target penetration (2026): 10,000 devices (0.7%)             │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

## Deployed Contracts

The BaeSensorRegistry contract for the current MVP has been deployed to Polkadot Paseo Hub Testnet. You can inspect transactions and contract state on BlockScout:

* **Deployed contract address**: `0xfD0b399898efC0186E32eb81B630d7Cf7Bb6f217`
* **BlockScout (Paseo)**: https://blockscout-passet-hub.parity-testnet.parity.io/address/0xfD0b399898efC0186E32eb81B630d7Cf7Bb6f217
* **Chain ID**: 420420422
* **Network**: Paseo Hub Testnet
* **RPC URL**: https://testnet-passet-hub-eth-rpc.polkadot.io

## Live Demo

* **Frontend Application**: https://bae-frontend-plum.vercel.app/
* **Backend API**: https://bae-backend-api.onrender.com
* **Test Dashboard**: https://bae-frontend-plum.vercel.app/test

## Technology Stack

### Frontend
* Next.js 15 (App Router)
* Tailwind CSS v4
* Viem + Wagmi (Web3)
* RainbowKit (Wallet connection)
* TanStack Query (Data fetching)
* Recharts (Data visualization)

### Backend
* Node.js + Express
* Ethers.js (Blockchain interaction)
* Crypto (AES-256-GCM decryption)
* CORS (Cross-origin support)

### Smart Contracts
* Solidity 0.8.28
* Hardhat (Development framework)
* Polkadot Paseo Testnet

### IoT Gateway & Sensor
* Rust (High-performance, memory-safe)
* MQTT protocol (HiveMQ broker)
* AES-256-GCM encryption
* SHA-256 signatures
* Deployed on Render.com

### Blockchain
* Polkadot Paseo Hub Testnet
* EVM-compatible (Ethereum compatibility layer)
* JSON-RPC interface

## API Endpoints

### Backend API (Production)

**Base URL**: `https://bae-backend-api.onrender.com`

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check and service status |
| `/api/readings/latest/decrypt` | GET | Latest decrypted sensor reading |
| `/api/readings/:index/decrypt` | GET | Specific reading by index |
| `/api/readings/history` | GET | Paginated reading history (limit 1-100) |
| `/api/readings/count` | GET | Total number of readings |
| `/api/readings/stats` | GET | Aggregated statistics (avg, min, max, alerts) |

### Example Response

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

### Example API Usage

```bash
# Health check
curl https://bae-backend-api.onrender.com/health

# Get latest reading
curl https://bae-backend-api.onrender.com/api/readings/latest/decrypt

# Get total readings
curl https://bae-backend-api.onrender.com/api/readings/count

# Get history (last 20 readings)
curl https://bae-backend-api.onrender.com/api/readings/history?limit=20

# Get statistics
curl https://bae-backend-api.onrender.com/api/readings/stats?limit=50
```

## Smart Contract ABI

Key functions available in the BaeSensorRegistry contract:

```solidity
// Submit encrypted sensor data
function submitSensorData(
    string deviceId,
    bytes ciphertext,
    bytes nonce,
    bytes signature,
    uint256 timestamp
) external

// Get latest reading
function getLatestReading() external view returns (SensorData)

// Get total number of readings
function totalReadings() external view returns (uint256)

// Get specific reading by index
function getReading(uint256 index) external view returns (SensorData)

// Data structure
struct SensorData {
    string deviceId;
    bytes ciphertext;
    bytes nonce;
    bytes signature;
    uint256 timestamp;
    uint256 blockNumber;
}

// Event emitted on new data
event SensorDataSubmitted(
    string indexed deviceId,
    uint256 timestamp,
    uint256 blockNumber,
    uint256 index
)
```

## Environmental Variables

### Frontend (.env.local)
```bash
NEXT_PUBLIC_API_URL=https://bae-backend-api.onrender.com
NEXT_PUBLIC_RPC_URL=https://testnet-passet-hub-eth-rpc.polkadot.io
NEXT_PUBLIC_CONTRACT_ADDRESS=0xfD0b399898efC0186E32eb81B630d7Cf7Bb6f217
NEXT_PUBLIC_CHAIN_ID=420420422
NEXT_PUBLIC_NETWORK_NAME="Paseo Testnet"
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_project_id
```

### Backend (.env)
```bash
PORT=3001
FRONTEND_URL=https://bae-frontend-plum.vercel.app
RPC_URL=https://testnet-passet-hub-eth-rpc.polkadot.io
CONTRACT_ADDRESS=0xfD0b399898efC0186E32eb81B630d7Cf7Bb6f217
ENCRYPTION_KEY=your_32_byte_hex_key
NODE_ENV=production
```

### Gateway (.env)
```bash
RUST_LOG=info
MQTT_BROKER=broker.hivemq.com
MQTT_PORT=1883
RPC_URL=https://testnet-passet-hub-eth-rpc.polkadot.io
CONTRACT_ADDRESS=0xfD0b399898efC0186E32eb81B630d7Cf7Bb6f217
PRIVATE_KEY=your_private_key
ENCRYPTION_KEY=your_32_byte_hex_key
```

## Documentation

* **Technical Docs**: Complete architecture and integration guides available in repository
* **API Reference**: Full endpoint documentation with examples
* **Smart Contract Docs**: ABI and function reference
* **Security Whitepaper**: Encryption and privacy model details

## Contributing

We welcome contributions that help save babies' lives! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'feat: add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

All contributions require:
* Code review and approval
* Security assessment for sensitive components
* Documentation updates
* Test coverage

**Report security issues**: security@bae-project.io

## Social Impact

BAE is committed to reducing neonatal mortality in Latin America through:

* **Accessible Technology**: Low-cost IoT devices for vulnerable communities
* **Open Data**: Anonymous research datasets for medical advancement
* **Community Partnerships**: Collaboration with hospitals and NGOs
* **Education**: Training programs for parents and healthcare workers
* **Transparency**: Open-source approach with verifiable blockchain data

### Target Impact (2025-2027)

```
┌────────────────────────────────────────────────────────────────────┐
│                      IMPACT METRICS                                 │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  2025 Goals:                                                       │
│  ├─ 1,000 devices deployed                                        │
│  ├─ 10 partner institutions                                       │
│  ├─ 10,000+ babies monitored                                      │
│  └─ 5 research publications                                       │
│                                                                    │
│  2026 Goals:                                                       │
│  ├─ 10,000 devices deployed                                       │
│  ├─ 50 partner institutions                                       │
│  ├─ 100,000+ babies monitored                                     │
│  ├─ 5% reduction in preventable deaths (pilot communities)       │
│  └─ 100+ research papers using BAE data                           │
│                                                                    │
│  2027 Vision:                                                      │
│  ├─ 50,000 devices across Latin America                          │
│  ├─ 200 partner institutions                                      │
│  ├─ 500,000+ babies monitored                                     │
│  ├─ 10% reduction in neonatal mortality (covered areas)          │
│  └─ International expansion                                        │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

## License

Apache 2.0 License

**Important**: Ensure regulatory compliance with local healthcare data protection laws before deployment. BAE is designed with privacy-first principles but must be configured according to jurisdictional requirements.

## Team & Contact

BAE Team - Decentralized IoT for Neonatal Care

* **Website**: [bae-project.io] (coming soon)
* **Email**: contact@bae-project.io
* **Security**: security@bae-project.io
* **Twitter**: [@BAE_Project] (coming soon)
* **Discord**: [Community Server] (coming soon)

## Acknowledgments

* Built with support from the Polkadot ecosystem
* Inspired by the need to reduce neonatal mortality in Latin America
* Dedicated to all parents who have lost children during the neonatal period
* Special thanks to healthcare professionals providing guidance on clinical requirements

---

**BAE - Because every baby deserves a safe environment** 🍼
