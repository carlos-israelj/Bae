async function main() {
  const contractAddress = require('fs').readFileSync('../CONTRACT_ADDRESS.txt', 'utf8').trim();
  const deviceId = process.env.DEVICE_ID || "ESP32-001";
  
  console.log("Registering device:", deviceId);
  console.log("Contract:", contractAddress);
  
  const BaeSensorRegistry = await ethers.getContractFactory("BaeSensorRegistry");
  const registry = BaeSensorRegistry.attach(contractAddress);
  
  const tx = await registry.registerDevice(deviceId);
  console.log("⏳ TX sent:", tx.hash);
  
  await tx.wait();
  console.log("✅ Device registered!");
  
  // Verificar
  const device = await registry.devices(deviceId);
  console.log("   Owner:", device.owner);
  console.log("   Active:", device.isActive);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
