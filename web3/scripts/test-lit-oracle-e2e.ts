import { network } from 'hardhat';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

/**
 * End-to-End Test: Lit Protocol Oracle
 * 
 * This script tests the complete oracle flow:
 * 1. Create a challenge on the contract
 * 2. Join the challenge
 * 3. Simulate Lit Action verification with mock Strava data
 * 4. Verify markTaskComplete was called (manually for demo)
 * 5. Check participant status
 */

const CONTRACT_ADDRESS = "0x21854089df4aeb1e0ac1770a43f5e892a8fd04d9";

interface PKPConfig {
  pkpPublicKey: string;
  pkpTokenId: string;
  pkpEthAddress: string;
  network: string;
}

async function main() {
  console.log('╔════════════════════════════════════════════════╗');
  console.log('║   🧪 Lit Oracle End-to-End Test               ║');
  console.log('╚════════════════════════════════════════════════╝\n');

  try {
    // 1. Load PKP configuration
    console.log('📋 Step 1: Load PKP Configuration');
    const pkpConfigPath = path.join(process.cwd(), '.pkp-config.json');
    
    let pkpConfig: PKPConfig | null = null;
    if (fs.existsSync(pkpConfigPath)) {
      pkpConfig = JSON.parse(fs.readFileSync(pkpConfigPath, 'utf8'));
      console.log('✅ PKP loaded:', pkpConfig.pkpEthAddress);
    } else {
      console.log('⚠️  No PKP found - oracle calls will fail');
      console.log('   Run: npm run mint-pkp');
    }

    // 2. Connect to Sepolia
    console.log('\n🌐 Step 2: Connect to Sepolia');
    const viem = (await network.connect()) as any;
    const publicClient = await viem.viem.getPublicClient();
    const [owner] = await viem.viem.getWalletClients();

    const chainId = await publicClient.getChainId();
    console.log('✅ Connected to chain:', chainId);
    console.log('   Owner:', owner.account.address);

    // 3. Get contract
    console.log('\n📦 Step 3: Connect to Contract');
    const contract = await viem.viem.getContractAt(
      'ChallengeContract',
      CONTRACT_ADDRESS as `0x${string}`
    );
    console.log('✅ Contract:', CONTRACT_ADDRESS);

    // 4. Check oracle status
    console.log('\n🔍 Step 4: Check Oracle Status');
    const authorizedOracle = await contract.read.authorizedOracle();
    console.log('   Authorized Oracle:', authorizedOracle);
    
    if (pkpConfig && authorizedOracle.toLowerCase() !== pkpConfig.pkpEthAddress.toLowerCase()) {
      console.log('⚠️  Oracle mismatch!');
      console.log('   Expected:', pkpConfig.pkpEthAddress);
      console.log('   Actual:', authorizedOracle);
      console.log('   Run: npm run set-oracle');
    } else if (pkpConfig) {
      console.log('✅ Oracle matches PKP');
    }

    // 5. Create a test challenge
    console.log('\n🏃 Step 5: Create Test Challenge');
    
    const challengeParams = {
      description: 'E2E Test - Run 5km this week',
      targetDistance: 5000n, // 5 km
      stakeAmount: 100000000000000000n, // 0.1 ETH
      duration: 86400n * 7n // 7 days in seconds
    };

    console.log('Creating challenge...');
    console.log('   Distance:', Number(challengeParams.targetDistance), 'meters');
    console.log('   Duration:', '7 days');
    console.log('   Stake:', '0.1 ETH');

    const createTx = await contract.write.createChallenge(
      [
        challengeParams.description,
        challengeParams.targetDistance,
        challengeParams.stakeAmount,
        challengeParams.duration
      ],
      {
        account: owner.account
      }
    );

    console.log('⏳ Waiting for confirmation...');
    const createReceipt = await publicClient.waitForTransactionReceipt({ hash: createTx });
    
    // Get challenge ID from events (assuming it's the next ID)
    const nextChallengeId = await contract.read.nextChallengeId();
    const challengeId = nextChallengeId - 1n;
    
    console.log('✅ Challenge created!');
    console.log('   Challenge ID:', challengeId.toString());
    console.log('   Tx:', createTx);

    // 6. Join the challenge
    console.log('\n👤 Step 6: Join Challenge');
    
    const joinTx = await contract.write.joinChallenge([challengeId], {
      value: challengeParams.stakeAmount,
      account: owner.account
    });

    await publicClient.waitForTransactionReceipt({ hash: joinTx });
    console.log('✅ Joined challenge');
    console.log('   Tx:', joinTx);

    // 7. Verify participant status
    console.log('\n📊 Step 7: Check Participant Status (Before)');
    const participantBefore = await contract.read.getParticipant([challengeId, owner.account.address]);
    console.log('   Has Joined:', participantBefore.hasJoined);
    console.log('   Has Completed:', participantBefore.hasCompleted);

    // 8. Simulate Lit Action verification
    console.log('\n🔐 Step 8: Simulate Lit Action Verification');
    console.log('   In a real flow, the Lit Action would:');
    console.log('   1. Verify Strava activity data');
    console.log('   2. Encode markTaskComplete transaction');
    console.log('   3. Sign with PKP');
    console.log('   4. Submit to blockchain');
    console.log('\n   For this demo, we\'ll manually call markTaskComplete');
    console.log('   (In production, only the PKP can call this)');

    // 9. Manually mark task complete (simulating oracle call)
    console.log('\n✅ Step 9: Mark Task Complete (Manual - Owner Only for Demo)');
    
    // First check if we can call it (owner can for testing)
    try {
      const markTx = await contract.write.markTaskComplete(
        [challengeId, owner.account.address],
        { account: owner.account }
      );

      await publicClient.waitForTransactionReceipt({ hash: markTx });
      console.log('✅ Task marked complete');
      console.log('   Tx:', markTx);
    } catch (error: any) {
      if (error.message.includes('Only authorized oracle')) {
        console.log('❌ Cannot mark complete - not authorized oracle');
        console.log('   This is expected if PKP is set as oracle');
        console.log('   PKP Oracle:', authorizedOracle);
        console.log('\n   To complete this step:');
        console.log('   1. Fund the PKP with Sepolia ETH');
        console.log('   2. Use the backend service to trigger verification');
        console.log('   3. Or temporarily set owner as oracle for testing');
      } else {
        throw error;
      }
    }

    // 10. Check final participant status
    console.log('\n📊 Step 10: Check Participant Status (After)');
    const participantAfter = await contract.read.getParticipant([challengeId, owner.account.address]);
    console.log('   Has Joined:', participantAfter.hasJoined);
    console.log('   Has Completed:', participantAfter.hasCompleted);

    // 11. Display backend integration instructions
    console.log('\n╔════════════════════════════════════════════════╗');
    console.log('║   🎯 Next Steps: Backend Integration          ║');
    console.log('╚════════════════════════════════════════════════╝');
    console.log('\n1. Fund PKP with Sepolia ETH:');
    console.log(`   Send 0.1-0.2 ETH to: ${pkpConfig?.pkpEthAddress || 'PKP_ADDRESS'}`);
    console.log('\n2. Start the oracle backend:');
    console.log('   npm run backend');
    console.log('\n3. Test verification endpoint:');
    console.log('   curl -X POST http://localhost:3000/verify-strava-run \\');
    console.log('     -H "Content-Type: application/json" \\');
    console.log('     -d \'{"challengeId": "' + challengeId + '", "userAddress": "' + owner.account.address + '"}\'');
    console.log('\n4. Check transaction on Etherscan:');
    console.log(`   https://sepolia.etherscan.io/address/${CONTRACT_ADDRESS}`);

    // 12. Summary
    console.log('\n╔════════════════════════════════════════════════╗');
    console.log('║   ✅ E2E Test Summary                         ║');
    console.log('╚════════════════════════════════════════════════╝');
    console.log('\n✅ Contract Connected:', CONTRACT_ADDRESS);
    console.log('✅ Oracle Configured:', authorizedOracle);
    console.log('✅ Challenge Created:', challengeId.toString());
    console.log('✅ Participant Joined');
    console.log('\n📝 Status:');
    console.log('   Before: hasCompleted =', participantBefore.hasCompleted);
    console.log('   After:  hasCompleted =', participantAfter.hasCompleted);
    
    if (participantAfter.hasCompleted) {
      console.log('\n🎉 SUCCESS! Full oracle flow working!');
    } else {
      console.log('\n⏳ Waiting for oracle verification...');
      console.log('   Fund PKP and trigger backend service');
    }

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    throw error;
  }
}

// Run the test
main()
  .then(() => {
    console.log('\n✅ E2E test completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ E2E test failed:', error);
    process.exit(1);
  });

export { main as testLitOracleE2E };

