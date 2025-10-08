const hre = require("hardhat");
const fs = require("fs");

/**
 * Este script intenta verificar el código fuente del contrato en el explorer
 * Nota: La verificación automática puede no estar soportada en Paseo Hub Testnet
 */
async function main() {
  console.log("🔍 Verificando código fuente en el explorer...\n");
  
  const contractAddress = fs.readFileSync('../CONTRACT_ADDRESS.txt', 'utf8').trim();
  
  console.log("📍 Contrato:", contractAddress);
  console.log("🌐 Red:", hre.network.name);
  console.log("");
  
  try {
    // Intentar verificar el contrato
    console.log("⏳ Enviando código fuente al explorer...");
    
    await hre.run("verify:verify", {
      address: contractAddress,
      constructorArguments: [], // BaeSensorRegistry no tiene argumentos en el constructor
    });
    
    console.log("\n✅ Contrato verificado exitosamente!");
    console.log("🔗 Ver en explorer:", `https://blockscout-passet-hub.parity-testnet.parity.io/address/${contractAddress}`);
    
  } catch (error) {
    if (error.message.includes("Already Verified")) {
      console.log("\n✅ El contrato ya está verificado");
      console.log("🔗 Ver en explorer:", `https://blockscout-passet-hub.parity-testnet.parity.io/address/${contractAddress}`);
    } else if (error.message.includes("does not support Etherscan verification")) {
      console.log("\n⚠️  Verificación automática no disponible para Paseo Hub Testnet");
      console.log("\n💡 Verificación manual:");
      console.log("   1. Ve al explorer:", `https://blockscout-passet-hub.parity-testnet.parity.io/address/${contractAddress}`);
      console.log("   2. Click en 'Code' o 'Verify & Publish'");
      console.log("   3. Selecciona compilador: Solidity 0.8.28");
      console.log("   4. Sube el archivo: contracts/BaeSensorRegistry.sol");
      console.log("   5. Configura optimización: Enabled, 200 runs");
      console.log("\n📄 Código fuente:");
      const sourceCode = fs.readFileSync('./contracts/BaeSensorRegistry.sol', 'utf8');
      console.log("   Ubicación: ./contracts/BaeSensorRegistry.sol");
      console.log("   Líneas:", sourceCode.split('\n').length);
    } else {
      console.error("\n❌ Error:", error.message);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });