# 🚀 Tateematy Vaccination System - Technology Stack Documentation

## 📋 **Project Overview**
Tateematy is a comprehensive vaccination management system that combines traditional web technologies with blockchain for immutable record-keeping and token-based rewards.

---

## 🎨 **Frontend Stack**

### **Core Framework**
- **React 18** - Modern React with hooks and functional components
- **TypeScript** - Type-safe JavaScript development
- **React Router v6** - Client-side routing and navigation

### **UI & Styling**
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Modern icon library
- **Custom Components** - Reusable UI components built with Tailwind

### **State Management**
- **React Context API** - Global state management (authentication, user data)
- **React Hooks** - Local state management (useState, useEffect, useCallback)

### **Key Frontend Features**
- **Responsive Design** - Mobile-first approach with Tailwind breakpoints
- **Component Architecture** - Modular, reusable components
- **Form Handling** - Controlled components with validation
- **Real-time Updates** - Live blockchain verification status
- **Progressive Web App** - Service worker and offline capabilities

### **Frontend Structure**
```
src/
├── components/          # Reusable UI components
├── pages/              # Main application pages
├── hooks/              # Custom React hooks
├── lib/                # API clients and utilities
├── types/              # TypeScript type definitions
└── assets/             # Images, logos, and static files
```

---

## ⚙️ **Backend Stack**

### **Core Runtime**
- **Node.js** - JavaScript runtime environment
- **Express.js** - Web application framework
- **MongoDB** - NoSQL database with Mongoose ODM

### **Database & Models**
- **MongoDB Atlas** - Cloud-hosted MongoDB service
- **Mongoose** - MongoDB object modeling and validation
- **Data Models**:
  - User (parents, doctors, admins)
  - Child (vaccination records, personal info)
  - VaccinationRecord (vaccine details, blockchain hashes)
  - VaccinationSchedule (vaccine schedules and due dates)
  - Certificate (IPFS-stored vaccination certificates)

### **Authentication & Security**
- **JWT (JSON Web Tokens)** - Stateless authentication
- **bcryptjs** - Password hashing and verification
- **CORS** - Cross-origin resource sharing
- **Helmet** - Security headers middleware

### **API Architecture**
- **RESTful API** - Standard HTTP methods and status codes
- **Route-based Structure**:
  - `/api/auth` - Authentication endpoints
  - `/api/users` - User management
  - `/api/children` - Child management
  - `/api/vaccinations` - Vaccination records
  - `/api/certificates` - Certificate management
  - `/api/token-rewards` - Blockchain token rewards

### **Services Layer**
- **Service Pattern** - Business logic separation
- **Blockchain Integration** - Smart contract interactions
- **IPFS Integration** - Decentralized file storage
- **PDF Generation** - Certificate and report generation

### **Backend Structure**
```
backend/
├── config/             # Database and blockchain configuration
├── models/             # Mongoose data models
├── routes/             # API route handlers
├── services/           # Business logic services
├── middleware/         # Authentication and validation
├── contracts/          # Smart contract artifacts
└── scripts/            # Database and deployment scripts
```

---

## ⛓️ **Blockchain Stack**

### **Network & Infrastructure**
- **Vanar Vanguard** - Main blockchain network (Chain ID: 78600)
- **RPC Endpoint** - `https://rpc-vanguard.vanarchain.com`
- **Block Explorer** - `https://explorer.vanarchain.com`

### **Smart Contracts**
- **Solidity** - Smart contract programming language
- **OpenZeppelin** - Secure contract libraries and standards
- **Hardhat** - Development, testing, and deployment framework

### **Smart Contract Details**

#### **VaccinationRecords Contract**
- **Address**: `0x520bE7131713496f44f2c84264Cd44B3369581C4`
- **Purpose**: Immutable storage of vaccination records
- **Features**:
  - Record vaccinations with metadata
  - Generate unique record hashes
  - Store transaction history
  - Owner-only recording (for demo purposes)

#### **TateematyToken Contract**
- **Address**: `0x3083AD49C27286DaB08881405F48ca50C96d80E6`
- **Purpose**: ERC-20 token for vaccination rewards
- **Features**:
  - Mint tokens for completed vaccinations
  - Transfer tokens between users
  - Burn tokens for certificate generation

### **Blockchain Integration**
- **Ethers.js v6** - Ethereum library for smart contract interaction
- **Web3 Integration** - Backend blockchain service layer
- **Real-time Updates** - Live transaction status monitoring

### **Data Flow**
1. **Doctor records vaccination** → MongoDB + Smart Contract
2. **Blockchain transaction** → Generates unique record hash
3. **Database update** → Stores blockchain transaction details
4. **Frontend display** → Shows verification status and explorer links

---

## 🔗 **Integration Points**

### **Frontend ↔ Backend**
- **REST API calls** - Data fetching and updates
- **JWT authentication** - Secure user sessions
- **Real-time updates** - Live data synchronization

### **Backend ↔ Blockchain**
- **Smart contract calls** - Record vaccinations and mint tokens
- **Transaction monitoring** - Track blockchain confirmations
- **Gas management** - Optimize transaction costs

### **Frontend ↔ Blockchain**
- **Transaction verification** - Direct links to blockchain explorer
- **Status indicators** - Real-time blockchain verification status
- **User transparency** - Public verification of all records

---

## 🛠️ **Development Tools**

### **Frontend Development**
- **Create React App** - Project scaffolding
- **ESLint + Prettier** - Code quality and formatting
- **React Developer Tools** - Browser debugging
- **Hot Reload** - Fast development iteration

### **Backend Development**
- **Nodemon** - Auto-restart on file changes
- **MongoDB Compass** - Database visualization
- **Postman/Insomnia** - API testing
- **Jest** - Unit testing framework

### **Blockchain Development**
- **Hardhat** - Smart contract development
- **Ganache** - Local blockchain testing
- **MetaMask** - Wallet integration
- **Remix IDE** - Online Solidity development
