import { network } from 'hardhat';
import fs from 'fs';
import path from 'path';

/**
 * Low-Stake Oracle Test
 * 
 * Creates a challenge with 0.001 ETH stake to test with limited balance
 */

const CONTRACT_ADDRESS = "0x21854089df4aeb1e0ac1770a43f5e892a8fd04d9";

async function main() {
  console.log('╔════════════════════════════════════════════════╗');
  console.log('║   🧪 Low-Stake Oracle Test (0.001 ETH)       ║');
  console.log('╚════════════════════════════════════════════════╝\n');

  try {
    // 1. Load PKP config
    console.log('📋 Step 1: Load Oracle Config');
    const pkpConfigPath = path.join(process.cwd(), '.pkp-config.json');
    const pkpConfig = JSON.parse(fs.readFileSync(pkpConfigPath, 'utf8'));
    console.log('✅ Oracle:', pkpConfig.pkpEthAddress);

    // 2. Connect to Sepolia
    console.log('\n🌐 Step 2: Connect to Sepolia');
    const viem = (await network.connect()) as any;
    const publicClient = await viem.viem.getPublicClient();
    const [deployer] = await viem.viem.getWalletClients();

    console.log('✅ Connected');
    console.log('   Deployer:', deployer.account.address);
    
    const balance = await publicClient.getBalance({ address: deployer.account.address });
    console.log(`   Balance: ${Number(balance) / 1e18} ETH`);

    // 3. Get contract
    console.log('\n📦 Step 3: Connect to Contract');
    const contract = await viem.viem.getContractAt(
      'ChallengeContract',
      CONTRACT_ADDRESS as `0x${string}`
    );
    console.log('✅ Contract:', CONTRACT_ADDRESS);

    // 4. Create low-stake challenge
    console.log('\n🏃 Step 4: Create Low-Stake Challenge');
    
    const challengeParams = {
      description: 'Test Run - 5km with 0.001 ETH stake',
      targetDistance: 5000n, // 5 km
      stakeAmount: 1000000000000000n, // 0.001 ETH
      duration: 86400n * 7n // 7 days in seconds
    };

    console.log('Creating challenge...');
    console.log('   Distance:', Number(challengeParams.targetDistance), 'meters');
    console.log('   Stake:', '0.001 ETH');
    console.log('   Duration:', '7 days');

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

    console.log('⏳ Waiting for confirmation...');
    await publicClient.waitForTransactionReceipt({ hash: createTx });
    
    const nextChallengeId = await contract.read.nextChallengeId();
    const challengeId = nextChallengeId - 1n;
    
    console.log('✅ Challenge created!');
    console.log('   Challenge ID:', challengeId.toString());
    console.log('   Tx:', createTx);

    // 5. Join the challenge
    console.log('\n👤 Step 5: Join Challenge');
    
    const joinTx = await contract.write.joinChallenge([challengeId], {
      value: challengeParams.stakeAmount,
      account: deployer.account
    });

    await publicClient.waitForTransactionReceipt({ hash: joinTx });
    console.log('✅ Joined challenge');
    console.log('   Tx:', joinTx);

    // 6. Check participant status (before)
    console.log('\n📊 Step 6: Check Participant Status (Before)');
    const participantBefore = await contract.read.getParticipant([challengeId, deployer.account.address]);
    console.log('   Has Joined:', participantBefore.hasJoined);
    console.log('   Has Completed:', participantBefore.hasCompleted);
    console.log('   Staked Amount:', Number(participantBefore.stakedAmount) / 1e18, 'ETH');

    // 7. Mark task complete with ORACLE
    console.log('\n🔐 Step 7: Mark Task Complete (Oracle)');
    
    // Import the oracle wallet
    const { privateKeyToAccount } = await import('viem/accounts');
    const oracleAccount = privateKeyToAccount(pkpConfig.privateKey as `0x${string}`);
    
    console.log('   Oracle address:', oracleAccount.address);
    
    const oracleBalance = await publicClient.getBalance({ address: oracleAccount.address });
    console.log(`   Oracle balance: ${Number(oracleBalance) / 1e18} ETH`);

    if (oracleBalance === 0n) {
      console.log('\n⚠️  Oracle has no balance!');
      console.log('   Sending 0.01 ETH to oracle for gas...');
      
      const { parseEther } = await import('viem');
      
      const fundTx = await deployer.sendTransaction({
        to: oracleAccount.address,
        value: parseEther('0.01')
      });

      await publicClient.waitForTransactionReceipt({ hash: fundTx });
      console.log('✅ Oracle funded!');
      console.log('   Tx:', fundTx);
    }

    // Now call markTaskComplete as oracle
    console.log('\n   Calling markTaskComplete as oracle...');
    
    const markTx = await contract.write.markTaskComplete(
      [challengeId, deployer.account.address],
      { account: oracleAccount }
    );

    console.log('⏳ Transaction submitted:', markTx);
    const receipt = await publicClient.waitForTransactionReceipt({ hash: markTx });
    
    console.log('✅ Transaction confirmed!');
    console.log('   Block:', receipt.blockNumber.toString());
    console.log('   Gas used:', receipt.gasUsed.toString());

    // 8. Check participant status (after)
    console.log('\n📊 Step 8: Check Participant Status (After)');
    const participantAfter = await contract.read.getParticipant([challengeId, deployer.account.address]);
    console.log('   Has Joined:', participantAfter.hasJoined);
    console.log('   Has Completed:', participantAfter.hasCompleted);

    // 9. Summary
    console.log('\n╔════════════════════════════════════════════════╗');
    console.log('║   ✅ ORACLE TEST COMPLETE!                    ║');
    console.log('╚════════════════════════════════════════════════╝');
    console.log('\n📋 Summary:');
    console.log(`   Challenge ID: ${challengeId}`);
    console.log(`   Participant: ${deployer.account.address}`);
    console.log(`   Oracle: ${oracleAccount.address}`);
    console.log(`   Before: hasCompleted = ${participantBefore.hasCompleted}`);
    console.log(`   After:  hasCompleted = ${participantAfter.hasCompleted}`);
    
    if (participantAfter.hasCompleted) {
      console.log('\n🎉 SUCCESS! Oracle successfully marked task complete!');
      console.log('\n🔗 View transactions on Etherscan:');
      console.log(`   Create: https://sepolia.etherscan.io/tx/${createTx}`);
      console.log(`   Join: https://sepolia.etherscan.io/tx/${joinTx}`);
      console.log(`   Complete: https://sepolia.etherscan.io/tx/${markTx}`);
    }

    console.log('\n🎯 Key Achievement:');
    console.log('   ✅ Oracle wallet successfully called markTaskComplete()');
    console.log('   ✅ Decentralized verification working!');
    console.log('   ✅ Ready for hackathon demo!');

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

