import { network } from 'hardhat';
import fs from 'fs';
import path from 'path';

/**
 * Set PKP as Oracle on Deployed Contract
 * 
 * This script sets the PKP (Programmable Key Pair) as the authorized oracle
 * on the already-deployed ChallengeContract on Sepolia
 */

// Allow override via environment variable for enhanced contract
const CONTRACT_ADDRESS = process.env.ENHANCED_CONTRACT_ADDRESS || "0xbaf067fe68f032d9fdc906c6dcb32299baa2404f      ";

async function main() {
  console.log('🔧 Setting PKP as Authorized Oracle...\n');

  try {
    // 1. Load PKP configuration
    console.log('📋 Loading PKP configuration...');
    const pkpConfigPath = path.join(process.cwd(), '.pkp-config.json');
    
    if (!fs.existsSync(pkpConfigPath)) {
      throw new Error(
        'PKP config not found! Run "npm run mint-pkp" first to create a PKP.'
      );
    }

    const pkpConfig = JSON.parse(fs.readFileSync(pkpConfigPath, 'utf8'));
    console.log('✅ PKP loaded');
    console.log('   PKP Address:', pkpConfig.pkpEthAddress);
    console.log('   PKP Token ID:', pkpConfig.pkpTokenId);
    console.log('   Network:', pkpConfig.network);

    // 2. Connect to network
    console.log('\n🌐 Connecting to Sepolia...');
    const viem = (await network.connect()) as any;
    const publicClient = await viem.viem.getPublicClient();
    const [deployer] = await viem.viem.getWalletClients();

    const chainId = await publicClient.getChainId();
    console.log('✅ Connected to chain:', chainId);
    console.log('   Deployer:', deployer.account.address);

    // Verify we're on Sepolia
    if (Number(chainId) !== 11155111) {
      throw new Error(`Wrong network! Expected Sepolia (11155111), got ${chainId}`);
    }

    // 3. Get contract instance
    console.log('\n📦 Connecting to deployed contract...');
    const contract = await viem.viem.getContractAt(
      'ChallengeContract',
      CONTRACT_ADDRESS as `0x${string}`
    );
    console.log('✅ Contract loaded at:', CONTRACT_ADDRESS);

    // 4. Check current oracle
    console.log('\n🔍 Checking current oracle status...');
    const currentOracle = await contract.read.authorizedOracle();
    const contractOwner = await contract.read.owner();
    
    console.log('   Contract Owner:', contractOwner);
    console.log('   Current Oracle:', currentOracle);

    // Verify deployer is owner
    if (contractOwner.toLowerCase() !== deployer.account.address.toLowerCase()) {
      throw new Error(
        'You are not the contract owner! Only the owner can set the oracle address.'
      );
    }

    // Check if oracle is already set
    if (currentOracle.toLowerCase() === pkpConfig.pkpEthAddress.toLowerCase()) {
      console.log('\n⚠️  Oracle is already set to this PKP address!');
      console.log('   No changes needed.');
      return;
    }

    // 5. Set PKP as oracle
    console.log('\n🔐 Setting PKP as authorized oracle...');
    const tx = await contract.write.setOracleAddress([pkpConfig.pkpEthAddress as `0x${string}`]);
    
    console.log('⏳ Transaction submitted:', tx);
    console.log('   Waiting for confirmation...');

    const receipt = await publicClient.waitForTransactionReceipt({ hash: tx });
    console.log('✅ Transaction confirmed!');
    console.log('   Block:', receipt.blockNumber.toString());
    console.log('   Gas used:', receipt.gasUsed.toString());

    // 6. Verify oracle was set
    const newOracle = await contract.read.authorizedOracle();
    console.log('\n🎯 Verification:');
    console.log('   New Oracle Address:', newOracle);
    
    if (newOracle.toLowerCase() === pkpConfig.pkpEthAddress.toLowerCase()) {
      console.log('   ✅ Oracle set successfully!');
    } else {
      throw new Error('Oracle verification failed! Address mismatch.');
    }

    // 7. Display summary
    console.log('\n╔════════════════════════════════════════════════╗');
    console.log('║        ✅ ORACLE SETUP COMPLETE!              ║');
    console.log('╚════════════════════════════════════════════════╝');
    console.log('\n📋 Summary:');
    console.log(`   Contract: ${CONTRACT_ADDRESS}`);
    console.log(`   Oracle (PKP): ${pkpConfig.pkpEthAddress}`);
    console.log(`   Network: Sepolia`);
    console.log(`   Transaction: ${tx}`);
    
    console.log('\n🔗 View on Etherscan:');
    console.log(`   https://sepolia.etherscan.io/tx/${tx}`);
    
    console.log('\n📝 Next Steps:');
    console.log('1. Ensure PKP has Sepolia ETH for gas');
    console.log('   PKP needs ~0.1-0.2 ETH to call markTaskComplete()');
    console.log('2. Start the backend service:');
    console.log('   npm run backend');
    console.log('3. Test the oracle:');
    console.log('   npm run test-lit-sepolia');

  } catch (error) {
    console.error('\n❌ Error setting oracle:', error);
    throw error;
  }
}

// Run the script
main()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });

export { main as setOracle };

