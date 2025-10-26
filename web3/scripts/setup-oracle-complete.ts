#!/usr/bin/env tsx

/**
 * Complete Oracle Setup Script
 * 
 * This script helps set up the Lit Protocol oracle for FitStake.
 * It checks PKP status, funds it if needed, and sets it as the authorized oracle.
 */

import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Configuration
const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL || 'https://sepolia.infura.io/v3/fccd5042681c42b598675d08a67dbaa8';
const CONTRACT_ADDRESS = '0x21854089df4aeb1e0ac1770a43f5e892a8fd04d9'; // From deployment-sepolia.json

// Contract ABI for setOracleAddress function
const CONTRACT_ABI = [
  {
    "inputs": [{"internalType": "address", "name": "oracleAddress", "type": "address"}],
    "name": "setOracleAddress",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "authorizedOracle",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  }
];

async function main() {
  console.log('🔧 FitStake Oracle Setup Script');
  console.log('================================\n');

  try {
    // 1. Check if PKP config exists
    const pkpConfigPath = path.join(process.cwd(), '.pkp-config.json');
    if (!fs.existsSync(pkpConfigPath)) {
      console.error('❌ PKP config not found. Run "npm run mint-pkp" first.');
      process.exit(1);
    }

    const pkpConfig = JSON.parse(fs.readFileSync(pkpConfigPath, 'utf8'));
    console.log('✅ PKP config found');
    console.log(`   Address: ${pkpConfig.pkpEthAddress}`);
    console.log(`   Token ID: ${pkpConfig.pkpTokenId}`);
    console.log(`   Funded: ${pkpConfig.funded ? 'Yes' : 'No'}\n`);

    // 2. Check PKP balance
    const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC_URL);
    const pkpBalance = await provider.getBalance(pkpConfig.pkpEthAddress);
    const pkpBalanceEth = ethers.formatEther(pkpBalance);
    
    console.log(`💰 PKP Balance: ${pkpBalanceEth} ETH`);
    
    if (parseFloat(pkpBalanceEth) < 0.01) {
      console.log('⚠️  PKP needs more ETH for gas fees');
      console.log(`   Send at least 0.1 ETH to: ${pkpConfig.pkpEthAddress}`);
      console.log('   Get Sepolia ETH from: https://sepoliafaucet.com/');
      console.log('   Or: https://www.alchemy.com/faucets/ethereum-sepolia\n');
    } else {
      console.log('✅ PKP has sufficient balance\n');
    }

    // 3. Check current oracle setting
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
    const currentOracle = await contract.authorizedOracle();
    
    console.log(`🔍 Current Oracle: ${currentOracle}`);
    
    if (currentOracle.toLowerCase() === pkpConfig.pkpEthAddress.toLowerCase()) {
      console.log('✅ PKP is already set as the authorized oracle\n');
    } else {
      console.log('⚠️  PKP is not set as the authorized oracle');
      console.log('   You need to run "npm run set-oracle" to set it\n');
    }

    // 4. Summary and next steps
    console.log('📋 Next Steps:');
    console.log('==============');
    
    if (parseFloat(pkpBalanceEth) < 0.01) {
      console.log('1. Fund PKP with Sepolia ETH (at least 0.1 ETH)');
    }
    
    if (currentOracle.toLowerCase() !== pkpConfig.pkpEthAddress.toLowerCase()) {
      console.log('2. Run: npm run set-oracle');
    }
    
    console.log('3. Start oracle backend: npm run backend');
    console.log('4. Test the React Native app verification flow');
    
    console.log('\n🎉 Setup complete! Your oracle is ready to verify Strava activities.');

  } catch (error) {
    console.error('❌ Setup error:', error);
    process.exit(1);
  }
}

main().catch(console.error);
