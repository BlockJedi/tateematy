const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying VaccinationRecords contract...");

  // Get the contract factory
  const VaccinationRecords = await ethers.getContractFactory("VaccinationRecords");
  
  // Deploy the contract
  const vaccinationRecords = await VaccinationRecords.deploy();
  
  // Wait for deployment to complete
  await vaccinationRecords.waitForDeployment();
  
  // Get the deployed contract address
  const contractAddress = await vaccinationRecords.getAddress();
  
  console.log("✅ VaccinationRecords deployed successfully!");
  console.log("📍 Contract Address:", contractAddress);
  console.log("👤 Deployer:", (await ethers.getSigners())[0].address);
  
  // Verify deployment
  console.log("\n🔍 Verifying deployment...");
  
  try {
    // Check if contract is deployed
    const code = await ethers.provider.getCode(contractAddress);
    if (code === "0x") {
      throw new Error("Contract deployment failed - no code at address");
    }
    
    // Get contract stats
    const stats = await vaccinationRecords.getContractStats();
    console.log("📊 Contract Stats:");
    console.log("   Total Records:", stats[0].toString());
    console.log("   Contract Balance:", ethers.formatEther(stats[1]), "ETH");
    
    // Check owner
    const owner = await vaccinationRecords.owner();
    console.log("👑 Contract Owner:", owner);
    
    console.log("✅ Contract verification successful!");
    
  } catch (error) {
    console.error("❌ Contract verification failed:", error.message);
  }
  
  // Save deployment info
  const deploymentInfo = {
    contractName: "VaccinationRecords",
    contractAddress: contractAddress,
    deployer: (await ethers.getSigners())[0].address,
    deploymentTime: new Date().toISOString(),
    constructorArgs: [],
    abi: VaccinationRecords.interface.format()
  };
  
  // You can save this to a file or database for future reference
  console.log("\n📝 Deployment Info:");
  console.log(JSON.stringify(deploymentInfo, null, 2));
  
  // Instructions for next steps
  console.log("\n🎯 Next Steps:");
  console.log("1. Authorize doctors using authorizeDoctor() function");
  console.log("2. Update your backend to use this contract address");
  console.log("3. Test recording a vaccination using recordVaccination()");
  console.log("4. Verify records using getVaccinationRecord()");
  
  return {
    contractAddress,
    deploymentInfo
  };
}

// Handle errors
main()
  .then(() => {
    console.log("\n🎉 Deployment completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Deployment failed:", error);
    process.exit(1);
  });
