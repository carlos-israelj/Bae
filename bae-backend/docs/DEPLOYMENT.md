# Guía de Despliegue - Bae Backend

## 🎯 Resumen

Deploy en **Render.com** con conexión a **Polkadot Paseo Testnet**.

## 📋 Prerequisitos

- Cuenta en [Render.com](https://render.com) (gratis)
- Repositorio en GitHub
- Rust 1.75+ (para testing local)

## 🚀 Deploy Paso a Paso

### Paso 1: Preparar el Código
```bash
# Clonar repositorio
git clone <tu-repo>
cd bae-backend

# Generar metadata de Paseo (solo una vez)
./scripts/generate-metadata.sh

# Verificar compilación
cargo build --release

# Push a GitHub
git add .
git commit -m "Initial commit"
git push origin main
Paso 2: Crear Servicios en Render
2.1 API Server (Web Service)

Ve a https://dashboard.render.com
Click "New +" → "Web Service"
Conecta tu repositorio
Configuración:

Name: bae-api-server
Environment: Rust
Build Command: cargo build --release --bin api-server
Start Command: ./target/release/api-server
Instance Type: Free


Environment Variables:

   PORT=3000
   RUST_LOG=info
   BLOCKCHAIN_ENDPOINT=wss://paseo-rpc.polkadot.io
   ENCRYPTION_KEY=<genera con: openssl rand -hex 32>

Click "Create Web Service"
Esperar build (~10 min)
Tu API estará en: https://bae-api-server.onrender.com

2.2 Gateway (Background Worker)

Click "New +" → "Background Worker"
Mismo repositorio
Configuración:

Name: bae-gateway
Build Command: cargo build --release --bin gateway
Start Command: ./target/release/gateway


Environment Variables:

   RUST_LOG=info
   MQTT_BROKER=broker.hivemq.com
   MQTT_PORT=1883
   BLOCKCHAIN_ENDPOINT=wss://paseo-rpc.polkadot.io
   ENCRYPTION_KEY=<mismo que API Server>
2.3 Sensor Simulator (Background Worker)

Click "New +" → "Background Worker"
Configuración:

Name: bae-sensor-simulator
Build Command: cargo build --release --bin sensor-simulator
Start Command: ./target/release/sensor-simulator


Environment Variables:

   RUST_LOG=info
   MQTT_BROKER=broker.hivemq.com
   MQTT_PORT=1883
   DEVICE_ID=ESP32-001
   INTERVAL_SECS=30
Paso 3: Verificar Funcionamiento
bash# Health check
curl https://bae-api-server.onrender.com/health

# Última lectura (espera 1-2 minutos)
curl https://bae-api-server.onrender.com/api/v1/sensors/ESP32-001/latest

# Probar todos los endpoints
./examples/test-api.sh
Paso 4: Ver en Polkadot Explorer

Ve a https://polkadot.js.org/apps/
Conecta a: wss://paseo-rpc.polkadot.io
Network → Explorer
Busca eventos system.Remarked
Verás tus datos cifrados almacenados

🐛 Troubleshooting
Build falla
bash# Verificar localmente
cargo clean
cargo build --release
Gateway no conecta
bash# Verificar logs en Render
Dashboard → bae-gateway → Logs

# Verificar MQTT broker
telnet broker.hivemq.com 1883
API no responde
bash# Verificar Paseo Testnet
curl -X POST https://paseo-rpc.polkadot.io \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"system_health","params":[],"id":1}'
Service se duerme (Free Tier)
Usar UptimeRobot (gratis):

URL: https://bae-api-server.onrender.com/health
Intervalo: 10 minutos

💰 Costos

Free Tier: $0/mes (API + 1 worker)
Starter: $7/mes por worker adicional
Professional: $25/mes (más recursos)

✅ Checklist

 Código en GitHub
 API Server desplegado
 Gateway desplegado
 Simulator desplegado (opcional)
 Variables configuradas
 Health check funciona
 Datos en Paseo Testnet
 Frontend puede conectarse