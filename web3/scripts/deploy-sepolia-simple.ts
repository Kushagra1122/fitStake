import { network } from 'hardhat';
import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';

/**
 * Simple Sepolia Deployment Script
 * 
 * Deploys ChallengeContract without PKP oracle setup
 * You can set the oracle address manually later
 */

interface DeploymentInfo {
  contractAddress: string;
  network: string;
  deployedAt: string;
  txHash: string;
  etherscanUrl: string;
  owner: string;
}

async function main() {
  console.log('🚀 Starting Simple Sepolia Deployment...\n');

  try {
    // 1. Check network
    console.log('🌐 Checking network configuration...');
    const viem = (await network.connect()) as any;
    const publicClient = await viem.viem.getPublicClient();
    const [deployer] = await viem.viem.getWalletClients();

    const chainId = await publicClient.getChainId();
    console.log('📍 Chain ID:', chainId);
    console.log('👤 Deployer:', deployer.account.address);

    // Verify we're on Sepolia
    if (Number(chainId) !== 11155111) {
      throw new Error(`Wrong network! Expected Sepolia (11155111), got ${chainId}`);
    }

    // Check balance
    const balance = await publicClient.getBalance({ address: deployer.account.address });
    console.log('💰 Deployer Balance:', ethers.formatEther(balance), 'ETH');
    
    if (balance < ethers.parseEther('0.01')) {
      console.warn('⚠️  Warning: Low balance. You may need more Sepolia ETH.');
    }

    // 2. Deploy ChallengeContract
    console.log('\n📦 Deploying ChallengeContract to Sepolia...');
    
    // Deploy the contract
    const challengeContract = await viem.viem.deployContract('ChallengeContract');
    
    console.log('⏳ Waiting for deployment confirmation...');
    console.log('✅ Contract deployed successfully!');
    console.log('📍 Contract Address:', challengeContract.address);
    
    // Get the deployment transaction hash from recent transactions
    // In viem, we can check the contract's deployment by querying the address
    const code = await publicClient.getBytecode({ address: challengeContract.address });
    if (!code || code === '0x') {
      throw new Error('Contract deployment failed - no code at address');
    }
    
    console.log('✅ Contract code verified on-chain');

    // 3. Verify contract owner
    const owner = await challengeContract.read.owner();
    console.log('\n👤 Contract Owner:', owner);
    console.log('🆔 Next Challenge ID:', (await challengeContract.read.nextChallengeId()).toString());

    // 4. Generate Etherscan URL
    const etherscanUrl = `https://sepolia.etherscan.io/address/${challengeContract.address}`;
    
    // 5. Save deployment info
    const deploymentInfo: DeploymentInfo = {
      contractAddress: challengeContract.address,
      network: 'sepolia',
      deployedAt: new Date().toISOString(),
      txHash: 'See Etherscan for deployment tx',
      etherscanUrl: etherscanUrl,
      owner: owner
    };

    const deploymentPath = path.join(process.cwd(), 'deployment-sepolia.json');
    fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
    console.log('\n💾 Deployment info saved to deployment-sepolia.json');

    // 6. Display summary
    console.log('\n╔════════════════════════════════════════════════╗');
    console.log('║     ✅ SEPOLIA DEPLOYMENT SUCCESSFUL!         ║');
    console.log('╚════════════════════════════════════════════════╝');
    console.log('\n📋 Contract Details:');
    console.log(`   Address: ${challengeContract.address}`);
    console.log(`   Owner: ${owner}`);
    console.log(`   Network: Sepolia (Chain ID: 11155111)`);
    console.log(`   Etherscan: ${etherscanUrl}`);
    console.log(`   Deployed: ${deploymentInfo.deployedAt}`);
    console.log('\n🔗 Use in React Native:');
    console.log(`   CONTRACT_ADDRESS = "${challengeContract.address}"`);
    console.log(`   SEPOLIA_CHAIN_ID = 11155111`);
    
    console.log('\n📝 Next Steps:');
    console.log('1. ✅ Copy the contract address above');
    console.log('2. 📱 Add it to your React Native app');
    console.log('3. 🔑 Set oracle address (optional):');
    console.log(`   npx hardhat run scripts/set-oracle.ts --network sepolia`);
    console.log('4. 🔍 View on Etherscan:');
    console.log(`   ${etherscanUrl}`);
    console.log('5. ✓ Verify contract (optional):');
    console.log(`   npx hardhat verify --network sepolia ${challengeContract.address}`);

    return deploymentInfo;

  } catch (error) {
    console.error('\n❌ Deployment failed:', error);
    throw error;
  }
}

// Run the deployment
main()
  .then(() => {
    console.log('\n✅ Deployment script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Deployment script failed:', error);
    process.exit(1);
  });

export { main as deploySepoliaSimple };

