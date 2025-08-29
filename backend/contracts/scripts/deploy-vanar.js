const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying TATEEMATY Token Contract on Vanar Vanguard...");
  console.log("🌐 Network: Vanar Vanguard (Chain ID: 2040)");
  console.log("🔗 RPC: https://rpc-vanguard.vanarchain.com");

  // Get the contract factory
  const TateematyToken = await ethers.getContractFactory("TateematyToken");
  
  // Deploy the contract
  console.log("📦 Deploying contract...");
  const tateematyToken = await TateematyToken.deploy();
  
  // Wait for deployment to finish
  await tateematyToken.waitForDeployment();
  
  const address = await tateematyToken.getAddress();
  
  console.log("\n✅ TATEEMATY Token deployed successfully!");
  console.log("📍 Contract Address:", address);
  console.log("🌐 Network: Vanar Vanguard");
  console.log("🔗 Explorer: https://explorer-vanguard.vanarchain.com/address/" + address);
  
  console.log("\n📋 Contract Details:");
  console.log("   - Name: TATEEMATY");
  console.log("   - Symbol: TAT");
  console.log("   - Decimals: 18");
  console.log("   - Max Supply: 1,000,000 TAT");
  console.log("   - Full Completion Reward: 500 TAT");
  console.log("   - Initial Supply: 100,000 TAT");
  
  // Get initial supply
  const totalSupply = await tateematyToken.totalSupply();
  console.log("   - Current Total Supply:", ethers.formatEther(totalSupply), "TAT");
  
  // Get deployer address
  const [deployer] = await ethers.getSigners();
  console.log("   - Deployer:", deployer.address);
  
  // Verify deployment
  console.log("\n🔍 Verifying deployment...");
  const name = await tateematyToken.name();
  const symbol = await tateematyToken.symbol();
  const decimals = await tateematyToken.decimals();
  
  if (name === "TATEEMATY" && symbol === "TAT" && decimals === 18) {
    console.log("✅ Contract verification successful!");
  } else {
    console.log("❌ Contract verification failed!");
  }
  
  console.log("\n📝 Next steps:");
  console.log("1. Copy the contract address:", address);
  console.log("2. Update your backend configuration with the new contract address");
  console.log("3. Test the contract functionality on Vanar Vanguard");
  console.log("4. Consider verifying the contract on the explorer");
  
  console.log("\n🔐 Security Notes:");
  console.log("- The deployer address is the owner of the contract");
  console.log("- Only the owner can mint rewards and pause/unpause the contract");
  console.log("- Keep your private key secure and never share it");
  
  return address;
}

// Handle errors
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    console.error("💡 Make sure you have:");
    console.error("   - Set your PRIVATE_KEY in .env file");
    console.error("   - Have sufficient VANAR tokens for gas fees");
    console.error("   - Network is accessible");
    process.exit(1);
  });
