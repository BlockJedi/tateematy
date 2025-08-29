# 🪙 TATEEMATY Token Reward System

## Overview

The TATEEMATY (TAT) token is an ERC-20 token designed to incentivize parents to complete their children's vaccination schedules. Parents earn tokens for each completed vaccination and receive bonus tokens for completing the full schedule.

## 🎯 Tokenomics

- **Token Name**: TATEEMATY
- **Symbol**: TAT
- **Decimals**: 18
- **Total Supply**: 1,000,000 TAT
- **Initial Supply**: 100,000 TAT (for initial distribution)
- **Full Completion Reward**: 500 TAT (only for 100% vaccination completion)
- **No Partial Rewards**: Must complete entire schedule to earn tokens

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd backend/contracts
npm install
```

### 2. Environment Setup

Create a `.env` file in the `backend/contracts` directory:

```env
# Blockchain Configuration
PRIVATE_KEY=your_private_key_here
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/your_project_id
MAINNET_RPC_URL=https://mainnet.infura.io/v3/your_project_id

# Optional
ETHERSCAN_API_KEY=your_etherscan_api_key
REPORT_GAS=true
```

### 3. Compile Contracts

```bash
npm run compile
```

### 4. Deploy to Local Network

```bash
# Start local Hardhat node
npx hardhat node

# In another terminal, deploy the contract
npm run deploy
```

### 5. Deploy to Testnet (Sepolia)

```bash
npm run deploy:testnet
```

### 6. Deploy to Mainnet

```bash
npm run deploy:mainnet
```

## 📋 Contract Functions

### Core Functions

#### `recordVaccinationCompletion(address parent, string childId, uint256 vaccinationCount, bool isFullScheduleCompleted)`
- Records vaccination completion and mints tokens
- Only callable by authorized minters (backend system)
- Only awards tokens for 100% completion (500 TAT)

#### `setMinterAuthorization(address minter, bool authorized)`
- Authorizes or revokes minter access
- Only callable by contract owner

### View Functions

#### `getParentClaimInfo(address parent)`
- Returns parent's total claimed amount, last claim timestamp, and child count

#### `getChildClaimInfo(address parent, string childId)`
- Returns specific child's claim information

#### `getContractStats()`
- Returns total supply, rewards distributed, and parents rewarded

## 🔧 Backend Integration

### 1. Update Backend Environment

Add these variables to your backend `.env` file:

```env
# Blockchain Configuration
BLOCKCHAIN_RPC_URL=http://localhost:8545  # or your network RPC
CONTRACT_ADDRESS=deployed_contract_address_here
PRIVATE_KEY=your_backend_private_key_here
```

### 2. Install Ethers.js

```bash
cd backend
npm install ethers
```

### 3. Authorize Backend as Minter

After deployment, authorize your backend as a minter:

```javascript
// Using Hardhat console or script
const contract = await ethers.getContract("TateematyToken");
await contract.setMinterAuthorization("YOUR_BACKEND_ADDRESS", true);
```

## 🎮 Frontend Integration

The frontend includes a complete Token Rewards interface with:

- **Eligibility Check**: See if children qualify for rewards
- **Reward Calculation**: View potential token earnings
- **Token Claiming**: Claim tokens with wallet address
- **Contract Statistics**: View total supply and distribution

### API Endpoints

- `GET /api/token-rewards/eligibility/:childId` - Check eligibility
- `POST /api/token-rewards/claim/:childId` - Claim tokens
- `GET /api/token-rewards/parent-info` - Get parent token info
- `GET /api/token-rewards/contract-stats` - Get contract statistics

## 🧪 Testing

### Run Tests

```bash
npm test
```

### Test on Local Network

```bash
# Start local node
npx hardhat node

# Deploy and test
npm run deploy
```

### Test Token Rewards

1. Deploy contract to local network
2. Authorize backend as minter
3. Complete vaccinations in the system
4. Use frontend to claim tokens
5. Verify tokens in wallet

## 🔒 Security Features

- **Access Control**: Only authorized minters can record vaccinations
- **Anti-Double-Claim**: Each child can only claim once per completion
- **Pausable**: Emergency pause functionality for token transfers
- **Reentrancy Protection**: Prevents reentrancy attacks
- **Input Validation**: Comprehensive parameter validation

## 📊 Reward Calculation Examples

### Example 1: Child with 20 vaccinations completed (not 100%)
- Base Reward: 0 TAT (partial completion)
- **Total**: 0 TAT (must complete all vaccinations)

### Example 2: Child with full schedule completed (42 vaccinations)
- Full Completion Reward: 500 TAT
- **Total**: 500 TAT (100% completion achieved)

## 🌐 Network Configuration

### Local Development
- **Chain ID**: 1337
- **RPC URL**: http://127.0.0.1:8545

### Sepolia Testnet
- **Chain ID**: 11155111
- **RPC URL**: https://sepolia.infura.io/v3/your_project_id

### Ethereum Mainnet
- **Chain ID**: 1
- **RPC URL**: https://mainnet.infura.io/v3/your_project_id

## 🚨 Emergency Procedures

### Pause Token Transfers
```javascript
await contract.pause();
```

### Unpause Token Transfers
```javascript
await contract.unpause();
```

### Recover Accidental Tokens
```javascript
await contract.recoverToken(tokenAddress, recipientAddress);
```

## 📈 Monitoring and Analytics

The contract emits events for:
- Vaccination completion
- Token claiming
- Completion bonus awards
- Minter authorization changes

Use these events to track:
- Total rewards distributed
- Parent participation rates
- Vaccination completion trends

## 🔄 Future Enhancements

- **Staking**: Allow parents to stake tokens for additional rewards
- **Governance**: Token holders can vote on platform decisions
- **NFTs**: Award unique NFTs for vaccination milestones
- **Partnerships**: Integrate with other health platforms
- **Mobile App**: Native mobile application for token management

## 📞 Support

For technical support or questions about the token system:
- Check the contract code comments
- Review the test files for usage examples
- Contact the development team

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**Note**: Always test thoroughly on testnets before deploying to mainnet. Ensure proper security audits are conducted for production deployments.
