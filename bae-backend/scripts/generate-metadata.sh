#!/bin/bash
echo "🔗 Downloading Paseo Testnet metadata..."
mkdir -p metadata

# Opción 1: Con subxt CLI (si está instalado)
if command -v subxt &> /dev/null; then
    subxt metadata \
      --url wss://paseo-rpc.polkadot.io \
      --file metadata/paseo_metadata.scale
    echo "✅ Metadata saved"
else
    # Opción 2: Crear metadata vacío temporal
    echo "⚠️  subxt CLI not found. Creating placeholder..."
    echo "You'll need to install subxt CLI or download metadata manually"
    touch metadata/paseo_metadata.scale
    echo "Run: cargo install subxt-cli"
    echo "Then: subxt metadata --url wss://paseo-rpc.polkadot.io --file metadata/paseo_metadata.scale"
fi
