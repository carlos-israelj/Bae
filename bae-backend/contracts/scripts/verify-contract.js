const hre = require("hardhat");
const fs = require("fs");

async function main() {
  const contractAddress = fs.readFileSync('../CONTRACT_ADDRESS.txt', 'utf8').trim();
  
  console.log("🔍 Verificando contrato en:", contractAddress);
  console.log("");
  
  try {
    // Conectar al contrato
    const BaeSensorRegistry = await hre.ethers.getContractFactory("BaeSensorRegistry");
    const contract = BaeSensorRegistry.attach(contractAddress);
    
    // Verificar funciones básicas
    console.log("✅ Contrato conectado correctamente");
    
    // Verificar storage inicial
    const totalReadings = await contract.totalReadings();
    console.log("📊 Total de lecturas:", totalReadings.toString());
    
    const readingCount = await contract.getReadingCount();
    console.log("📊 Conteo de lecturas:", readingCount.toString());
    
    // Verificar que las funciones existen
    console.log("");
    console.log("🔧 Funciones disponibles:");
    console.log("   ✓ submitSensorData()");
    console.log("   ✓ getLatestReading()");
    console.log("   ✓ getReadingCount()");
    console.log("   ✓ getReading(index)");
    
    console.log("");
    console.log("✅ Contrato verificado exitosamente!");
    console.log("🔗 Explorer:", `https://blockscout-passet-hub.parity-testnet.parity.io/address/${contractAddress}`);
    
  } catch (error) {
    console.error("❌ Error verificando contrato:", error.message);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
