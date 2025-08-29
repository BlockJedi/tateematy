module.exports = {
  // Blockchain Network Configuration
  network: 'vanarVanguard',
  rpcUrl: 'https://rpc-vanguard.vanarchain.com',
  
  // Smart Contract Addresses
  vaccinationRecordsContract: '0x520bE7131713496f44f2c84264Cd44B3369581C4',
  
  // Gas Settings
  gasLimit: 5000000,
  gasPrice: '20000000000', // 20 gwei
  
  // Network Chain ID
  chainId: 78600, // Vanar Vanguard
  
  // Explorer URLs
  explorer: {
    baseUrl: 'https://explorer.vanarchain.com',
    transaction: 'https://explorer.vanarchain.com/tx',
    address: 'https://explorer.vanarchain.com/address'
  }
};
