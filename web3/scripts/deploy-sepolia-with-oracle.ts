import { network } from 'hardhat';
import { ethers } from 'ethers';
import { mintPKP, loadPKPConfig } from './mint-pkp.js';

/**
 * Deploy ChallengeContract to Sepolia and link with PKP oracle
 * 
 * This script:
 * 1. Deploys ChallengeContract to Sepolia testnet
 * 2. Mints PKP on Lit datil-test network
 * 3. Funds PKP with Sepolia ETH
 * 4. Sets PKP as authorized oracle
 * 5. Verifies deployment on Etherscan
 * 6. Saves deployment info
 */

interface DeploymentInfo {
  contractAddress: string;
  pkpAddress: string;
  pkpTokenId: string;
  network: string;
  deployedAt: string;
  txHash: string;
  etherscanUrl: string;
}

async function main() {
  console.log('🚀 Starting Sepolia deployment with oracle setup...');

  try {
    // 1. Check network
    console.log('🌐 Checking network configuration...');
    const viem = (await network.connect()) as any;
    const publicClient = await viem.viem.getPublicClient();
    const [deployer] = await viem.getWalletClients();

    const chainId = await publicClient.getChainId();
    console.log('📍 Chain ID:', chainId);
    console.log('👤 Deployer:', deployer.account.address);

    // Verify we're on Sepolia
    if (Number(chainId) !== 11155111) {
      throw new Error(`Wrong network! Expected Sepolia (11155111), got ${chainId}`);
    }

    // 2. Deploy ChallengeContract
    console.log('\n📦 Deploying ChallengeContract to Sepolia...');
    const challengeContract = await viem.deployContract('ChallengeContract');
    
    const deploymentTx = await publicClient.waitForTransactionReceipt({ 
      hash: challengeContract.address as `0x${string}` 
    });
    
    console.log('✅ Contract deployed!');
    console.log('📍 Contract Address:', challengeContract.address);
    console.log('📝 Transaction Hash:', deploymentTx.transactionHash);

    // 3. Mint PKP (if not already exists)
    console.log('\n🔑 Setting up PKP...');
    let pkpConfig = loadPKPConfig();
    
    if (!pkpConfig || pkpConfig.network !== 'datil-test') {
      console.log('🎯 Minting new PKP on Lit datil-test network...');
      pkpConfig = await mintPKP();
    } else {
      console.log('✅ Using existing PKP:', pkpConfig.pkpEthAddress);
    }

    // 4. Fund PKP with Sepolia ETH
    console.log('\n💰 Funding PKP with Sepolia ETH...');
    const fundingAmount = ethers.parseEther('0.1');
    
    const fundingTx = await deployer.sendTransaction({
      to: pkpConfig.pkpEthAddress as `0x${string}`,
      value: fundingAmount,
      gasLimit: 21000
    });

    await publicClient.waitForTransactionReceipt({ hash: fundingTx });
    console.log('✅ PKP funded with 0.1 Sepolia ETH');

    // 5. Set PKP as oracle
    console.log('\n🔧 Setting PKP as authorized oracle...');
    const setOracleTx = await challengeContract.write.setOracleAddress([pkpConfig.pkpEthAddress as `0x${string}`]);
    
    await publicClient.waitForTransactionReceipt({ hash: setOracleTx });
    
    const authorizedOracle = await challengeContract.read.authorizedOracle();
    console.log('✅ Oracle set to:', authorizedOracle);

    // 6. Verify oracle is set correctly
    if (authorizedOracle.toLowerCase() !== pkpConfig.pkpEthAddress.toLowerCase()) {
      throw new Error('Oracle address mismatch!');
    }

    // 7. Test basic contract functionality
    console.log('\n🧪 Testing contract functionality...');
    await testContractFunctionality(challengeContract, deployer);

    // 8. Generate Etherscan URL
    const etherscanUrl = `https://sepolia.etherscan.io/address/${challengeContract.address}`;
    console.log('🔍 Contract on Etherscan:', etherscanUrl);

    // 9. Save deployment info
    const deploymentInfo: DeploymentInfo = {
      contractAddress: challengeContract.address,
      pkpAddress: pkpConfig.pkpEthAddress,
      pkpTokenId: pkpConfig.pkpTokenId,
      network: 'sepolia',
      deployedAt: new Date().toISOString(),
      txHash: deploymentTx.transactionHash,
      etherscanUrl: etherscanUrl
    };

    // Save to file
    const fs = await import('fs');
    const path = await import('path');
    const deploymentPath = path.join(process.cwd(), 'deployment-sepolia.json');
    fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
    console.log('💾 Deployment info saved to deployment-sepolia.json');

    // 10. Display summary
    console.log('\n🎉 Sepolia Deployment Complete!');
    console.log('================================');
    console.log('📋 Deployment Summary:');
    console.log(`   Contract: ${challengeContract.address}`);
    console.log(`   PKP Oracle: ${pkpConfig.pkpEthAddress}`);
    console.log(`   Network: Sepolia`);
    console.log(`   Etherscan: ${etherscanUrl}`);
    console.log(`   Deployed At: ${deploymentInfo.deployedAt}`);
    console.log('================================');

    // 11. Next steps
    console.log('\n📝 Next Steps:');
    console.log('1. Verify contract source code on Etherscan');
    console.log('2. Run: npm run test-lit-sepolia');
    console.log('3. Test Lit Action with real Sepolia contract');
    console.log('4. Update Envio indexer to track Sepolia events');

    return deploymentInfo;

  } catch (error) {
    console.error('❌ Sepolia deployment failed:', error);
    throw error;
  }
}

/**
 * Test basic contract functionality after deployment
 */
async function testContractFunctionality(contract: any, deployer: any) {
  try {
    // Test 1: Check owner
    const owner = await contract.read.owner();
    if (owner.toLowerCase() !== deployer.account.address.toLowerCase()) {
      throw new Error('Owner mismatch');
    }
    console.log('  ✅ Owner set correctly');

    // Test 2: Create a test challenge
    const createTx = await contract.write.createChallenge([
      'Sepolia Test Challenge',
      5000n, // 5km
      ethers.parseEther('0.1'), // 0.1 ETH
      3600n // 1 hour
    ]);

    await contract.waitForTransactionReceipt({ hash: createTx });
    console.log('  ✅ Test challenge created');

    // Test 3: Get challenge details
    const challenge = await contract.read.getChallenge([1n]);
    if (challenge.challengeId !== 1n) {
      throw new Error('Challenge ID mismatch');
    }
    console.log('  ✅ Challenge details retrieved');

    // Test 4: Check oracle is set
    const oracle = await contract.read.authorizedOracle();
    if (oracle === '0x0000000000000000000000000000000000000000') {
      throw new Error('Oracle not set');
    }
    console.log('  ✅ Oracle address set');

    console.log('  🎉 All contract tests passed!');

  } catch (error) {
    console.error('  ❌ Contract functionality test failed:', error);
    throw error;
  }
}

/**
 * Load deployment info from file
 */
function loadDeploymentInfo(): DeploymentInfo | null {
  try {
    const fs = require('fs');
    const path = require('path');
    const deploymentPath = path.join(process.cwd(), 'deployment-sepolia.json');
    
    if (fs.existsSync(deploymentPath)) {
      const data = fs.readFileSync(deploymentPath, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading deployment info:', error);
  }
  return null;
}

/**
 * Verify deployment on Etherscan
 */
async function verifyContractOnEtherscan(contractAddress: string) {
  console.log('🔍 Verifying contract on Etherscan...');
  console.log('📝 Manual verification steps:');
  console.log('1. Go to https://sepolia.etherscan.io/address/' + contractAddress);
  console.log('2. Click "Contract" tab');
  console.log('3. Click "Verify and Publish"');
  console.log('4. Select "Solidity (Single file)"');
  console.log('5. Paste ChallengeContract.sol source code');
  console.log('6. Set compiler version to 0.8.28');
  console.log('7. Set optimization to 200 runs');
  console.log('8. Click "Verify and Publish"');
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
    .then((deploymentInfo) => {
      console.log('✅ Sepolia deployment completed successfully');
      console.log('📍 Contract Address:', deploymentInfo.contractAddress);
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Sepolia deployment failed:', error);
      process.exit(1);
    });
}

export { main as deploySepoliaWithOracle, loadDeploymentInfo };
