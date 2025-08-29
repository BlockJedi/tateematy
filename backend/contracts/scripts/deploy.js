const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying TATEEMATY Token Contract...");

  // Get the contract factory
  const TateematyToken = await ethers.getContractFactory("TateematyToken");
  
  // Deploy the contract
  const tateematyToken = await TateematyToken.deploy();
  
  // Wait for deployment to finish
  await tateematyToken.waitForDeployment();
  
  const address = await tateematyToken.getAddress();
  
  console.log("✅ TATEEMATY Token deployed to:", address);
  console.log("📋 Contract Details:");
      console.log("   - Name: TATEEMATY");
    console.log("   - Symbol: TAT");
    console.log("   - Decimals: 18");
    console.log("   - Max Supply: 1,000,000 TAT");
    console.log("   - Full Completion Reward: 500 TAT");
    console.log("   - No partial rewards - 100% completion required");
  
  // Get initial supply
  const totalSupply = await tateematyToken.totalSupply();
  console.log("   - Initial Supply:", ethers.formatEther(totalSupply), "TAT");
  
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
  console.log("2. Update your backend .env file with CONTRACT_ADDRESS");
  console.log("3. Authorize your backend as a minter using setMinterAuthorization()");
  console.log("4. Test the contract with your vaccination completion system");
  
  return address;
}

// Handle errors
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
