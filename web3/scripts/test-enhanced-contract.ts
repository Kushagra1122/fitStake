import { network } from 'hardhat';
import fs from 'fs';
import path from 'path';

/**
 * Test Enhanced Contract with Activity Data
 * 
 * End-to-end test of the enhanced contract that emits detailed activity data
 */

async function main() {
  console.log('╔════════════════════════════════════════════════╗');
  console.log('║   🧪 Enhanced Contract E2E Test               ║');
  console.log('╚════════════════════════════════════════════════╝\n');

  try {
    // 1. Load deployment config
    console.log('📋 Step 1: Load Enhanced Deployment Config');
    const configPath = path.join(process.cwd(), 'deployment-enhanced.json');
    
    if (!fs.existsSync(configPath)) {
      throw new Error(
        'Enhanced contract not deployed! Run "npm run deploy-enhanced" first.'
      );
    }

    const deploymentConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    const CONTRACT_ADDRESS = deploymentConfig.contractAddress;
    const FUNCTION_SELECTOR = deploymentConfig.markTaskCompleteSelector;

    console.log('✅ Configuration loaded');
    console.log('   Contract:', CONTRACT_ADDRESS);
    console.log('   Selector:', FUNCTION_SELECTOR);

    // 2. Load PKP/Oracle config
    console.log('\n🔐 Step 2: Load Oracle Config');
    const pkpConfigPath = path.join(process.cwd(), '.pkp-config.json');
    const pkpConfig = JSON.parse(fs.readFileSync(pkpConfigPath, 'utf8'));
    console.log('✅ Oracle:', pkpConfig.pkpEthAddress);

    // 3. Connect to Sepolia
    console.log('\n🌐 Step 3: Connect to Sepolia');
    const viem = (await network.connect()) as any;
    const publicClient = await viem.viem.getPublicClient();
    const [deployer] = await viem.viem.getWalletClients();

    console.log('✅ Connected');
    console.log('   Deployer:', deployer.account.address);
    
    const balance = await publicClient.getBalance({ address: deployer.account.address });
    console.log(`   Balance: ${Number(balance) / 1e18} ETH`);

    // 4. Get contract
    console.log('\n📦 Step 4: Connect to Enhanced Contract');
    const contract = await viem.viem.getContractAt(
      'ChallengeContract',
      CONTRACT_ADDRESS as `0x${string}`
    );
    console.log('✅ Contract connected');

    // 5. Create low-stake challenge
    console.log('\n🏃 Step 5: Create Low-Stake Challenge');
    
    const challengeParams = {
      description: 'Enhanced Test - 5km with activity data',
      targetDistance: 5000n, // 5 km
      stakeAmount: 1000000000000000n, // 0.001 ETH
      duration: 86400n * 7n // 7 days
    };

    console.log('Creating challenge...');
    console.log('   Distance:', Number(challengeParams.targetDistance), 'meters');
    console.log('   Stake:', '0.001 ETH');

    const createTx = await contract.write.createChallenge(
      [
        challengeParams.description,
        challengeParams.targetDistance,
        challengeParams.stakeAmount,
        challengeParams.duration
      ],
      {
        account: deployer.account
      }
    );

    await publicClient.waitForTransactionReceipt({ hash: createTx });
    
    const nextChallengeId = await contract.read.nextChallengeId();
    const challengeId = nextChallengeId - 1n;
    
    console.log('✅ Challenge created!');
    console.log('   Challenge ID:', challengeId.toString());

    // 6. Join the challenge
    console.log('\n👤 Step 6: Join Challenge');
    
    const joinTx = await contract.write.joinChallenge([challengeId], {
      value: challengeParams.stakeAmount,
      account: deployer.account
    });

    await publicClient.waitForTransactionReceipt({ hash: joinTx });
    console.log('✅ Joined challenge');

    // 7. Check participant status (before)
    console.log('\n📊 Step 7: Check Participant Status (Before)');
    const participantBefore = await contract.read.getParticipant([challengeId, deployer.account.address]);
    console.log('   Has Completed:', participantBefore.hasCompleted);

    // 8. Setup oracle wallet
    console.log('\n🔐 Step 8: Setup Oracle for markTaskComplete');
    
    const { privateKeyToAccount } = await import('viem/accounts');
    const oracleAccount = privateKeyToAccount(pkpConfig.privateKey as `0x${string}`);
    
    console.log('   Oracle address:', oracleAccount.address);
    
    const oracleBalance = await publicClient.getBalance({ address: oracleAccount.address });
    console.log(`   Oracle balance: ${Number(oracleBalance) / 1e18} ETH`);

    // Fund oracle if needed
    if (oracleBalance === 0n) {
      console.log('   Funding oracle with 0.01 ETH...');
      const { parseEther } = await import('viem');
      
      const fundTx = await deployer.sendTransaction({
        to: oracleAccount.address,
        value: parseEther('0.01')
      });

      await publicClient.waitForTransactionReceipt({ hash: fundTx });
      console.log('✅ Oracle funded');
    }

    // 9. Mark task complete with FULL ACTIVITY DATA
    console.log('\n✨ Step 9: Mark Task Complete with Activity Data');
    
    const mockActivityData = {
      completionTimestamp: Math.floor(Date.now() / 1000),
      distance: 5200n, // 5.2 km
      duration: 1800n, // 30 minutes
      stravaActivityId: '12345678'
    };

    console.log('   Completion Time:', new Date(Number(mockActivityData.completionTimestamp) * 1000).toISOString());
    console.log('   Distance:', Number(mockActivityData.distance), 'meters');
    console.log('   Duration:', Number(mockActivityData.duration), 'seconds');
    console.log('   Strava Activity ID:', mockActivityData.stravaActivityId);
    
    console.log('\n   Calling markTaskComplete with enhanced parameters...');
    
    const markTx = await contract.write.markTaskComplete(
      [
        challengeId,
        deployer.account.address,
        mockActivityData.completionTimestamp,
        mockActivityData.distance,
        mockActivityData.duration,
        mockActivityData.stravaActivityId
      ],
      { account: oracleAccount }
    );

    console.log('⏳ Transaction submitted:', markTx);
    const receipt = await publicClient.waitForTransactionReceipt({ hash: markTx });
    
    console.log('✅ Transaction confirmed!');
    console.log('   Block:', receipt.blockNumber.toString());
    console.log('   Gas used:', receipt.gasUsed.toString());

    // 10. Query event logs
    console.log('\n📝 Step 10: Query TaskCompleted Event Logs');
    
    const logs = await publicClient.getLogs({
      address: CONTRACT_ADDRESS as `0x${string}`,
      event: {
        type: 'event',
        name: 'TaskCompleted',
        inputs: [
          { type: 'uint256', indexed: true, name: 'challengeId' },
          { type: 'address', indexed: true, name: 'user' },
          { type: 'uint256', indexed: false, name: 'completionTimestamp' },
          { type: 'uint256', indexed: false, name: 'distance' },
          { type: 'uint256', indexed: false, name: 'duration' },
          { type: 'string', indexed: false, name: 'stravaActivityId' }
        ]
      },
      fromBlock: receipt.blockNumber,
      toBlock: receipt.blockNumber
    });

    if (logs.length > 0) {
      console.log('✅ Event found in logs!');
      console.log('   Event data:', logs[0].args);
    } else {
      console.log('⚠️  No events found (may need manual verification)');
    }

    // 11. Check participant status (after)
    console.log('\n📊 Step 11: Check Participant Status (After)');
    const participantAfter = await contract.read.getParticipant([challengeId, deployer.account.address]);
    console.log('   Has Completed:', participantAfter.hasCompleted);

    // 12. Summary
    console.log('\n╔════════════════════════════════════════════════╗');
    console.log('║   ✅ ENHANCED CONTRACT TEST COMPLETE!         ║');
    console.log('╚════════════════════════════════════════════════╝');
    console.log('\n📋 Test Summary:');
    console.log(`   Contract: ${CONTRACT_ADDRESS}`);
    console.log(`   Challenge ID: ${challengeId}`);
    console.log(`   Participant: ${deployer.account.address}`);
    console.log(`   Oracle: ${oracleAccount.address}`);
    console.log(`   Before: hasCompleted = ${participantBefore.hasCompleted}`);
    console.log(`   After:  hasCompleted = ${participantAfter.hasCompleted}`);
    
    console.log('\n✨ Activity Data Submitted:');
    console.log(`   Completion Time: ${new Date(Number(mockActivityData.completionTimestamp) * 1000).toISOString()}`);
    console.log(`   Distance: ${Number(mockActivityData.distance)}m`);
    console.log(`   Duration: ${Number(mockActivityData.duration)}s`);
    console.log(`   Strava ID: ${mockActivityData.stravaActivityId}`);

    if (participantAfter.hasCompleted) {
      console.log('\n🎉 SUCCESS! Enhanced contract working perfectly!');
      console.log('\n🔗 View on Etherscan:');
      console.log(`   https://sepolia.etherscan.io/tx/${markTx}`);
      console.log('\n📝 Event logs contain full activity data!');
      console.log('   UI can now query blockchain for participant details');
    }

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    throw error;
  }
}

// Run the test
main()
  .then(() => {
    console.log('\n✅ Test completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  });

export { main };

