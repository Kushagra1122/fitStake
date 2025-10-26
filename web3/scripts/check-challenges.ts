import { network } from 'hardhat';

const CONTRACT_ADDRESS = '0xe38d8f585936c60ecb7bfae7297457f6a35058bb';

async function main() {
  console.log('🔍 Checking existing challenges...\n');

  try {
    // Connect to network
    const viem = (await network.connect()) as any;
    const publicClient = await viem.viem.getPublicClient();

    const chainId = await publicClient.getChainId();
    console.log('✅ Connected to chain:', chainId);

    // Get contract instance
    const contract = await viem.viem.getContractAt('ChallengeContract', CONTRACT_ADDRESS);
    console.log('✅ Contract loaded at:', CONTRACT_ADDRESS);

    // Get next challenge ID
    const nextChallengeId = await contract.read.nextChallengeId();
    console.log('📊 Next Challenge ID:', nextChallengeId.toString());

    if (Number(nextChallengeId) === 0) {
      console.log('❌ No challenges exist yet');
      return;
    }

    // Check each challenge
    for (let i = 0; i < Number(nextChallengeId); i++) {
      try {
        const challenge = await contract.read.getChallenge([i]);
        console.log(`\n📋 Challenge ${i}:`);
        console.log('   Description:', challenge.description);
        console.log('   Target Distance:', challenge.targetDistance.toString(), 'meters');
        console.log('   Stake Amount:', challenge.stakeAmount.toString(), 'wei');
        console.log('   Start Time:', new Date(Number(challenge.startTime) * 1000).toISOString());
        console.log('   End Time:', new Date(Number(challenge.endTime) * 1000).toISOString());
        console.log('   Participant Count:', challenge.participantCount.toString());
        console.log('   Finalized:', challenge.finalized);
      } catch (error) {
        console.log(`❌ Challenge ${i}: Error reading challenge`);
      }
    }

  } catch (error) {
    console.error('❌ Error checking challenges:', error);
    throw error;
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
