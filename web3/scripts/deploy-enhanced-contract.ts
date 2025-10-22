import { network } from 'hardhat';
import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Deploy Enhanced ChallengeContract with Activity Data Events
 * 
 * This script deploys the updated contract that emits detailed Strava activity data
 * in the TaskCompleted event, and auto-calculates the new function selector.
 */

async function main() {
  console.log('╔════════════════════════════════════════════════╗');
  console.log('║   🚀 Enhanced Contract Deployment             ║');
  console.log('╚════════════════════════════════════════════════╝\n');

  try {
    // 1. Connect to network
    console.log('🌐 Step 1: Connect to Sepolia');
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

    const balance = await publicClient.getBalance({ address: deployer.account.address });
    console.log(`   Balance: ${Number(balance) / 1e18} ETH`);

    // 2. Deploy contract
    console.log('\n📦 Step 2: Deploy Enhanced ChallengeContract');
    console.log('   Deploying with enhanced TaskCompleted event...');

    const contract = await viem.viem.deployContract('ChallengeContract');
    
    console.log('⏳ Waiting for deployment confirmation...');
    console.log('✅ Contract deployed successfully!');
    console.log('   Contract Address:', contract.address);

    // Verify contract code on-chain
    const code = await publicClient.getBytecode({ address: contract.address });
    if (!code || code === '0x') {
      throw new Error('Contract deployment failed - no code at address');
    }
    console.log('✅ Contract code verified on-chain');

    // 3. Calculate function selector
    console.log('\n🔧 Step 3: Calculate Function Selector');
    
    // Get contract ABI
    const artifactPath = path.join(process.cwd(), 'artifacts', 'contracts', 'ChallengeContract.sol', 'ChallengeContract.json');
    const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
    
    // Create interface and get selector
    const iface = new ethers.Interface(artifact.abi);
    const markTaskCompleteFunc = iface.getFunction('markTaskComplete');
    const functionSelector = markTaskCompleteFunc?.selector;

    console.log('✅ Function selector calculated');
    console.log('   Function:', 'markTaskComplete(uint256,address,uint256,uint256,uint256,string)');
    console.log('   Selector:', functionSelector);

    // 4. Save deployment configuration
    console.log('\n💾 Step 4: Save Deployment Configuration');
    
    const deploymentConfig = {
      contractAddress: contract.address,
      markTaskCompleteSelector: functionSelector,
      network: 'sepolia',
      chainId: Number(chainId),
      deployedAt: new Date().toISOString(),
      deployer: deployer.account.address,
      features: {
        enhancedEvents: true,
        activityDataFields: [
          'completionTimestamp',
          'distance',
          'duration',
          'stravaActivityId'
        ]
      }
    };

    const configPath = path.join(process.cwd(), 'deployment-enhanced.json');
    fs.writeFileSync(configPath, JSON.stringify(deploymentConfig, null, 2));
    
    console.log('✅ Configuration saved to deployment-enhanced.json');

    // 5. Display summary
    console.log('\n╔════════════════════════════════════════════════╗');
    console.log('║   ✅ ENHANCED CONTRACT DEPLOYED!              ║');
    console.log('╚════════════════════════════════════════════════╝');
    console.log('\n📋 Deployment Summary:');
    console.log(`   Contract Address: ${contract.address}`);
    console.log(`   Function Selector: ${functionSelector}`);
    console.log(`   Network: Sepolia (${chainId})`);
    console.log(`   Deployer: ${deployer.account.address}`);
    
    console.log('\n🔗 View on Etherscan:');
    console.log(`   https://sepolia.etherscan.io/address/${contract.address}`);
    
    console.log('\n📝 Next Steps:');
    console.log('1. Set oracle address:');
    console.log(`   ENHANCED_CONTRACT_ADDRESS=${contract.address} npm run set-oracle`);
    console.log('2. Test the enhanced contract:');
    console.log('   npm run test-enhanced');
    console.log('3. Update your React Native app with the new contract address');
    console.log('4. Backend will automatically use the new function selector from deployment-enhanced.json');

  } catch (error) {
    console.error('\n❌ Deployment failed:', error);
    throw error;
  }
}

// Run the deployment
main()
  .then(() => {
    console.log('\n✅ Deployment completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Deployment failed:', error);
    process.exit(1);
  });

export { main as deployEnhancedContract };

