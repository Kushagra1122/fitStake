import { network } from 'hardhat';
import fs from 'fs';
import path from 'path';

/**
 * Simple Oracle Demo
 * 
 * Demonstrates the oracle can call markTaskComplete on the contract
 */

const CONTRACT_ADDRESS = "0xe38d8f585936c60ecb7bfae7297457f6a35058bb      ";

async function main() {
  console.log('╔════════════════════════════════════════════════╗');
  console.log('║   🔐 Oracle Demo - Mark Task Complete         ║');
  console.log('╚════════════════════════════════════════════════╝\n');

  try {
    // 1. Load PKP/Oracle wallet
    console.log('📋 Step 1: Load Oracle Wallet');
    const pkpConfigPath = path.join(process.cwd(), '.pkp-config.json');
    const pkpConfig = JSON.parse(fs.readFileSync(pkpConfigPath, 'utf8'));
    console.log('✅ Oracle wallet:', pkpConfig.pkpEthAddress);

    // 2. Connect to Sepolia
    console.log('\n🌐 Step 2: Connect to Sepolia');
    const viem = (await network.connect()) as any;
    const publicClient = await viem.viem.getPublicClient();
    
    // Import the oracle wallet
    const { privateKeyToAccount } = await import('viem/accounts');
    const oracleAccount = privateKeyToAccount(pkpConfig.privateKey as `0x${string}`);
    
    // Create wallet client for oracle
    const { createWalletClient, http } = await import('viem');
    const { sepolia } = await import('viem/chains');
    
    const oracleClient = createWalletClient({
      account: oracleAccount,
      chain: sepolia,
      transport: http(process.env.SEPOLIA_RPC_URL || 'https://rpc.sepolia.org')
    });

    console.log('✅ Connected');
    console.log('   Oracle:', oracleAccount.address);

    // Check balance
    const balance = await publicClient.getBalance({ address: oracleAccount.address });
    console.log(`   Balance: ${Number(balance) / 1e18} ETH`);

    if (balance === 0n) {
      console.log('\n⚠️  Oracle wallet has no balance!');
      console.log('   Send some Sepolia ETH to:', oracleAccount.address);
      console.log('   Even 0.01 ETH is enough for gas');
      return;
    }

    // 3. Get contract
    console.log('\n📦 Step 3: Connect to Contract');
    const contract = await viem.viem.getContractAt(
      'ChallengeContract',
      CONTRACT_ADDRESS as `0x${string}`
    );
    console.log('✅ Contract:', CONTRACT_ADDRESS);

    // 4. Check oracle status
    console.log('\n🔍 Step 4: Verify Oracle Authorization');
    const authorizedOracle = await contract.read.authorizedOracle();
    console.log('   Authorized Oracle:', authorizedOracle);
    
    if (authorizedOracle.toLowerCase() !== oracleAccount.address.toLowerCase()) {
      console.log('❌ Wallet is not the authorized oracle!');
      console.log('   Expected:', oracleAccount.address);
      console.log('   Actual:', authorizedOracle);
      return;
    }
    console.log('✅ Oracle is authorized!');

    // 5. Check if there's a challenge
    console.log('\n🏃 Step 5: Check for Existing Challenges');
    const nextChallengeId = await contract.read.nextChallengeId();
    const challengeId = nextChallengeId > 1n ? nextChallengeId - 1n : 1n;
    
    console.log('   Latest Challenge ID:', challengeId.toString());

    try {
      const challenge = await contract.read.getChallenge([challengeId]);
      console.log('✅ Challenge found');
      console.log('   Description:', challenge.description);
      console.log('   Target Distance:', Number(challenge.targetDistance), 'meters');
      console.log('   Participants:', Number(challenge.participantCount));
      
      // 6. Get participants
      if (Number(challenge.participantCount) > 0) {
        const participants = await contract.read.getChallengeParticipants([challengeId]);
        console.log('\n👥 Participants:', participants);
        
        if (participants.length > 0) {
          const userAddress = participants[0];
          const participant = await contract.read.getParticipant([challengeId, userAddress]);
          
          console.log('\n📊 Participant Status:');
          console.log('   Address:', userAddress);
          console.log('   Has Completed:', participant.hasCompleted);
          
          if (!participant.hasCompleted) {
            console.log('\n🔐 Step 6: Mark Task Complete (Oracle Call)');
            console.log('   Calling markTaskComplete...');
            
            // Call markTaskComplete as oracle
            const tx = await contract.write.markTaskComplete(
              [challengeId, userAddress],
              { account: oracleAccount }
            );
            
            console.log('⏳ Transaction submitted:', tx);
            const receipt = await publicClient.waitForTransactionReceipt({ hash: tx });
            
            console.log('✅ Transaction confirmed!');
            console.log('   Block:', receipt.blockNumber.toString());
            console.log('   Gas used:', receipt.gasUsed.toString());
            
            // Verify
            const updatedParticipant = await contract.read.getParticipant([challengeId, userAddress]);
            console.log('\n✅ Verification:');
            console.log('   Has Completed:', updatedParticipant.hasCompleted);
            
            console.log('\n🔗 View on Etherscan:');
            console.log(`   https://sepolia.etherscan.io/tx/${tx}`);
          } else {
            console.log('\n⏭️  Task already completed for this participant');
          }
        }
      } else {
        console.log('\n⚠️  No participants in this challenge yet');
        console.log('   Create and join a challenge first using:');
        console.log('   npm run test-deployed');
      }
      
    } catch (error:any) {
      if (error.message.includes('Challenge does not exist')) {
        console.log('❌ No challenge exists yet');
        console.log('   Create one first using: npm run test-deployed');
      } else {
        throw error;
      }
    }

    console.log('\n╔════════════════════════════════════════════════╗');
    console.log('║   ✅ ORACLE DEMO COMPLETE!                    ║');
    console.log('╚════════════════════════════════════════════════╝');
    console.log('\n📋 Summary:');
    console.log(`   Oracle Address: ${oracleAccount.address}`);
    console.log(`   Contract: ${CONTRACT_ADDRESS}`);
    console.log(`   Network: Sepolia`);
    console.log('\n🎯 Key Points:');
    console.log('   ✅ Oracle wallet is authorized');
    console.log('   ✅ Oracle can call markTaskComplete');
    console.log('   ✅ Decentralized verification working!');

  } catch (error) {
    console.error('\n❌ Demo failed:', error);
    throw error;
  }
}

// Run the demo
main()
  .then(() => {
    console.log('\n✅ Demo completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Demo failed:', error);
    process.exit(1);
  });

export { main };

