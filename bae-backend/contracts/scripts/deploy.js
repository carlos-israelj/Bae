async function main() {
  console.log("Deploying BaeSensorRegistry to Paseo Hub...");

  const BaeSensorRegistry = await ethers.getContractFactory("BaeSensorRegistry");
  const registry = await BaeSensorRegistry.deploy();

  await registry.waitForDeployment();
  const address = await registry.getAddress();

  console.log("✅ Deployed to:", address);
  console.log("🔗 Explorer:", `https://blockscout-passet-hub.parity-testnet.parity.io/address/${address}`);
  
  // Guardar dirección
  const fs = require('fs');
  fs.writeFileSync('../CONTRACT_ADDRESS.txt', address);
  console.log("💾 Address saved to CONTRACT_ADDRESS.txt");
  
  console.log("\n✅ Contract ready!");
  console.log("   Devices will auto-register on first data submission");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
