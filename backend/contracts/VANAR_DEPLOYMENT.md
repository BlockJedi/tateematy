# Deploying TATEEMATY Token on Vanar Vanguard

This guide will help you deploy the TATEEMATY Token contract on the Vanar Vanguard testnet.

## Prerequisites

1. **Node.js and npm** installed
2. **Private Key** for the wallet you want to deploy from
3. **VANAR tokens** for gas fees (get them from the Vanar faucet)

## Network Information

- **Network Name**: Vanar Vanguard
- **RPC URL**: https://rpc-vanguard.vanarchain.com
- **Chain ID**: 2040
- **Currency**: VANAR
- **Explorer**: https://explorer-vanguard.vanarchain.com

## Setup Steps

### 1. Install Dependencies

```bash
cd backend/contracts
npm install
```

### 2. Configure Environment

Create a `.env` file in the `backend/contracts` directory:

```bash
# Copy the example file
cp config.env.example .env

# Edit the .env file and add your private key
PRIVATE_KEY=your_actual_private_key_here
```

**⚠️ IMPORTANT**: 
- Never commit your `.env` file to version control
- Replace `your_actual_private_key_here` with your real private key
- Remove the `0x` prefix if your private key has it

### 3. Compile Contracts

```bash
npm run compile
```

### 4. Deploy to Vanar Vanguard

```bash
npm run deploy:vanar
```

## Deployment Process

The deployment script will:

1. Connect to the Vanar Vanguard network
2. Deploy the TATEEMATY Token contract
3. Display the contract address
4. Verify the deployment
5. Show contract details

## Expected Output

```
🚀 Deploying TATEEMATY Token Contract on Vanar Vanguard...
🌐 Network: Vanar Vanguard (Chain ID: 2040)
🔗 RPC: https://rpc-vanguard.vanarchain.com
📦 Deploying contract...

✅ TATEEMATY Token deployed successfully!
📍 Contract Address: 0x...
🌐 Network: Vanar Vanguard
🔗 Explorer: https://explorer-vanguard.vanarchain.com/address/0x...
```

## Contract Details

- **Name**: TATEEMATY
- **Symbol**: TAT
- **Decimals**: 18
- **Max Supply**: 1,000,000 TAT
- **Initial Supply**: 100,000 TAT (minted to deployer)
- **Reward per Child**: 500 TAT (for full vaccination completion)

## Post-Deployment Steps

1. **Save the contract address** - You'll need this for your backend
2. **Update your backend configuration** with the new contract address
3. **Test the contract** - Try minting some rewards
4. **Verify on explorer** (optional) - For transparency

## Troubleshooting

### Common Issues

1. **"Invalid private key"**
   - Make sure your private key is correct and doesn't have `0x` prefix
   - Ensure the `.env` file is in the correct directory

2. **"Insufficient funds"**
   - Get VANAR tokens from the faucet
   - Ensure your wallet has enough balance for gas fees

3. **"Network error"**
   - Check your internet connection
   - Verify the RPC URL is accessible

4. **"Gas estimation failed"**
   - Try increasing the gas limit in hardhat.config.js
   - Check if the network is congested

### Getting VANAR Tokens

Visit the Vanar faucet to get testnet tokens for gas fees.

## Security Notes

- **Never share your private key**
- **Use a dedicated wallet for deployment**
- **Keep your .env file secure**
- **The deployer becomes the contract owner**

## Support

If you encounter issues:

1. Check the error messages carefully
2. Verify your network configuration
3. Ensure you have sufficient funds
4. Check the Vanar Vanguard network status

## Contract Functions

After deployment, you can:

- **rewardParent(address, childId)** - Mint rewards (owner only)
- **pause()** - Pause the contract (owner only)
- **unpause()** - Resume the contract (owner only)
- **getStats()** - View contract statistics

The contract is now ready to integrate with your vaccination reward system!
