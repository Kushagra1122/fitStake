import { ethers } from 'ethers';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function setOracle() {
  // Get values from environment variables
  const PRIVATE_KEY = process.env.PRIVATE_KEY;
  const RPC_URL = process.env.RPC_URL || 'https://sepolia.infura.io/v3/fccd5042681c42b598675d08a67dbaa8';
  const PKP_ADDRESS = process.env.VINCENT_PKP_ADDRESS || '0xe8cb3F3BA7C674B6fb3C5B3cBe572964a5569D53'; // Default to your PKP address
  const contractAddress = '0xe38d8f585936c60ecb7bfae7297457f6a35058bb';

  // Validate required environment variables
  if (!PRIVATE_KEY) {
    console.error('❌ PRIVATE_KEY environment variable is required');
    console.log('💡 Add PRIVATE_KEY=your_wallet_private_key to your .env file');
    process.exit(1);
  }

  if (!PKP_ADDRESS) {
    console.error('❌ VINCENT_PKP_ADDRESS environment variable is required');
    console.log('💡 Add VINCENT_PKP_ADDRESS=0x...pkp_address to your .env file');
    console.log('💡 Get the PKP address from Vincent Dashboard after publishing your app');
    process.exit(1);
  }

  try {
    // Setup provider and signer
    const provider = new ethers.JsonRpcProvider(RPC_URL as string);
    const signer = new ethers.Wallet(PRIVATE_KEY, provider);

    // Contract ABI - you need the ABI for the ChallengeContract
    const contractABI = [
      'function setOracleAddress(address _oracle) external',
      'function authorizedOracle() external view returns (address)'
    ];

    // Get the contract
    const contract = new ethers.Contract(contractAddress, contractABI, signer);

    // Set the oracle address
    console.log('🔧 Setting oracle address...');
    console.log('Contract:', contractAddress);
    console.log('PKP Address:', PKP_ADDRESS);
    console.log('Signer address:', await signer.getAddress());
    
    const tx = await contract.setOracleAddress(PKP_ADDRESS);
    console.log('📤 Transaction sent:', tx.hash);
    
    const receipt = await tx.wait();
    
    console.log('✅ Oracle set successfully!');
    console.log('Transaction hash:', tx.hash);
    console.log('Block number:', receipt.blockNumber);
    console.log('Gas used:', receipt.gasUsed.toString());
    
    // Verify it was set correctly
    const currentOracle = await contract.authorizedOracle();
    console.log('🔍 Current oracle address:', currentOracle);
    
    if (currentOracle.toLowerCase() === PKP_ADDRESS.toLowerCase()) {
      console.log('✅ Verification successful! Oracle is correctly set.');
    } else {
      console.log('⚠️  Warning: Oracle address mismatch!');
    }

  } catch (error) {
    console.error('❌ Error setting oracle:', error);
    process.exit(1);
  }
}

setOracle().catch(console.error);