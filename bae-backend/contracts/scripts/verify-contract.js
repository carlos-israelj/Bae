const hre = require("hardhat");
const fs = require("fs");

async function main() {
  console.log("🔍 Verificando contrato BaeSensorRegistry...\n");
  
  // Leer dirección del contrato
  const contractAddress = fs.readFileSync('../CONTRACT_ADDRESS.txt', 'utf8').trim();
  
  console.log("📍 Dirección del contrato:", contractAddress);
  console.log("🌐 Red:", hre.network.name);
  console.log("");
  
  try {
    // Conectar al contrato
    const BaeSensorRegistry = await hre.ethers.getContractFactory("BaeSensorRegistry");
    const registry = BaeSensorRegistry.attach(contractAddress);
    
    console.log("✅ Contrato conectado correctamente\n");
    
    // ===== VERIFICACIÓN DE STORAGE =====
    console.log("📊 Estado del contrato:");
    console.log("─────────────────────────────────");
    
    const totalReadings = await registry.totalReadings();
    console.log("   Total de lecturas:", totalReadings.toString());
    
    const readingCount = await registry.getReadingCount();
    console.log("   Conteo de lecturas:", readingCount.toString());
    
    // ===== VERIFICAR ÚLTIMA LECTURA =====
    if (readingCount > 0) {
      console.log("\n📖 Última lectura registrada:");
      console.log("─────────────────────────────────");
      
      const latestReading = await registry.getLatestReading();
      console.log("   Device ID:", latestReading.deviceId);
      console.log("   Timestamp:", new Date(Number(latestReading.timestamp) * 1000).toLocaleString());
      console.log("   Block Number:", latestReading.blockNumber.toString());
      console.log("   Ciphertext length:", latestReading.ciphertext.length, "bytes");
      console.log("   Nonce length:", latestReading.nonce.length, "bytes");
      console.log("   Signature length:", latestReading.signature.length, "bytes");
      
      // Verificar las primeras lecturas
      if (readingCount >= 3) {
        console.log("\n📚 Primeras 3 lecturas:");
        console.log("─────────────────────────────────");
        for (let i = 0; i < 3; i++) {
          const reading = await registry.getReading(i);
          console.log(`   [${i}] Device: ${reading.deviceId} | Timestamp: ${new Date(Number(reading.timestamp) * 1000).toLocaleString()}`);
        }
      }
    } else {
      console.log("\n⚠️  No hay lecturas registradas aún");
    }
    
    // ===== VERIFICAR FUNCIONES =====
    console.log("\n🔧 Funciones disponibles:");
    console.log("─────────────────────────────────");
    console.log("   ✓ submitSensorData(deviceId, ciphertext, nonce, signature, timestamp)");
    console.log("   ✓ getLatestReading() → SensorData");
    console.log("   ✓ getReadingCount() → uint256");
    console.log("   ✓ getReading(index) → SensorData");
    console.log("   ✓ allReadings(index) → SensorData (public array)");
    console.log("   ✓ totalReadings() → uint256");
    
    // ===== INFORMACIÓN DE RED =====
    console.log("\n🌐 Información de la red:");
    console.log("─────────────────────────────────");
    const [signer] = await hre.ethers.getSigners();
    const balance = await hre.ethers.provider.getBalance(signer.address);
    const blockNumber = await hre.ethers.provider.getBlockNumber();
    
    console.log("   Cuenta actual:", signer.address);
    console.log("   Balance:", hre.ethers.formatEther(balance), "PAS");
    console.log("   Block actual:", blockNumber);
    
    // ===== LINKS ÚTILES =====
    console.log("\n🔗 Enlaces útiles:");
    console.log("─────────────────────────────────");
    console.log("   Explorer:", `https://blockscout-passet-hub.parity-testnet.parity.io/address/${contractAddress}`);
    console.log("   Transacciones:", `https://blockscout-passet-hub.parity-testnet.parity.io/address/${contractAddress}/transactions`);
    console.log("   Logs:", `https://blockscout-passet-hub.parity-testnet.parity.io/address/${contractAddress}/logs`);
    
    console.log("\n✅ Verificación completada exitosamente!");
    
  } catch (error) {
    console.error("\n❌ Error verificando contrato:");
    console.error(error.message);
    
    if (error.message.includes("call revert exception")) {
      console.error("\n💡 Posibles causas:");
      console.error("   - La dirección del contrato es incorrecta");
      console.error("   - El contrato no está desplegado en esta red");
      console.error("   - El RPC no está respondiendo correctamente");
    }
    
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });