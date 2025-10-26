"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bundledVincentAbility = exports.vincentAbility = void 0;
const vincent_ability_sdk_1 = require("@lit-protocol/vincent-ability-sdk");
const schemas_1 = require("./schemas");
// Contract ABI for joinChallenge
const CONTRACT_ABI = [
    'function joinChallenge(uint256 challengeId) payable',
    'function getChallenge(uint256 challengeId) view returns (tuple(uint256 challengeId, address creator, string description, uint256 targetDistance, uint256 stakeAmount, uint256 startTime, uint256 endTime, uint256 totalStaked, uint256 participantCount, bool finalized))',
    'function participants(uint256 challengeId, address user) view returns (tuple(address userAddress, bool hasCompleted, bool hasWithdrawn, uint256 stakedAmount))'
];
/**
 * Vincent Ability for Auto-Staking to Fitness Challenges
 *
 * IMPORTANT: stakeAmount must be passed as a string representing Wei (not ETH)
 * Example: "1000000000000000000" for 1 ETH, not "1"
 *
 * The ability validates that:
 * 1. Challenge exists and is active
 * 2. Stake amount matches the challenge requirement exactly
 * 3. User has not already joined the challenge
 * 4. PKP has sufficient funds to cover stake + gas
 */
exports.vincentAbility = (0, vincent_ability_sdk_1.createVincentAbility)({
    packageName: '@sogalabhi/ability-automatic-stake',
    description: 'Automatically stake user funds to fitness challenge via PKP',
    version: '2.0.0',
    supportedPolicies: {},
    abilityParamsSchema: schemas_1.abilityParamsSchema,
    precheckSuccessSchema: schemas_1.precheckSuccessSchema,
    precheckFailSchema: schemas_1.precheckFailSchema,
    executeSuccessSchema: schemas_1.executeSuccessSchema,
    executeFailSchema: schemas_1.executeFailSchema,
    precheck: async (params, helpers) => {
        const { abilityParams } = params;
        const { fail, succeed, delegation } = helpers;
        try {
            console.log('🔍 Precheck: Validating challenge and stake amount...');
            const { challengeId, contractAddress, stakeAmount, userAddress } = abilityParams;
            // Create contract instance for reading
            const provider = new ethers.providers.JsonRpcProvider(delegation.delegatorPkpInfo.rpcUrl || 'https://sepolia.infura.io/v3/fccd5042681c42b598675d08a67dbaa8');
            const contract = new ethers.Contract(contractAddress, CONTRACT_ABI, provider);
            // Get challenge details
            const challenge = await contract.getChallenge(challengeId);
            // Validate challenge exists
            if (challenge.challengeId.toString() === '0') {
                return fail({
                    error: 'CHALLENGE_NOT_FOUND',
                    reason: `Challenge ${challengeId} does not exist`
                });
            }
            // Validate challenge is active
            const now = Math.floor(Date.now() / 1000);
            if (now < challenge.startTime.toNumber()) {
                return fail({
                    error: 'CHALLENGE_NOT_STARTED',
                    reason: 'Challenge has not started yet'
                });
            }
            if (now > challenge.endTime.toNumber()) {
                return fail({
                    error: 'CHALLENGE_ENDED',
                    reason: 'Challenge has already ended'
                });
            }
            if (challenge.finalized) {
                return fail({
                    error: 'CHALLENGE_FINALIZED',
                    reason: 'Challenge has been finalized'
                });
            }
            // Validate stake amount matches (convert both to BigNumber for accurate comparison)
            const inputStakeAmount = ethers.BigNumber.from(stakeAmount);
            if (!challenge.stakeAmount.eq(inputStakeAmount)) {
                return fail({
                    error: 'INCORRECT_STAKE_AMOUNT',
                    reason: `Expected ${ethers.utils.formatEther(challenge.stakeAmount)} ETH, received ${ethers.utils.formatEther(inputStakeAmount)} ETH`
                });
            }
            // Check if user already joined (contract returns AddressZero if not joined)
            const participant = await contract.participants(challengeId, userAddress);
            if (participant.userAddress !== ethers.constants.AddressZero) {
                return fail({
                    error: 'ALREADY_JOINED',
                    reason: 'User has already joined this challenge'
                });
            }
            console.log('✅ Precheck passed');
            return succeed({
                validated: true,
                challengeId: challengeId,
                stakeAmount: stakeAmount,
                message: 'Challenge is active and stake amount is correct'
            });
        }
        catch (error) {
            console.error('❌ Precheck failed:', error);
            return fail({
                error: 'PRECHECK_ERROR',
                reason: error.message || 'Failed to validate challenge'
            });
        }
    },
    execute: async (params, helpers) => {
        const { abilityParams } = params;
        const { fail, succeed, delegation } = helpers;
        try {
            console.log('🚀 Executing auto-stake for challenge:', abilityParams.challengeId);
            const { challengeId, contractAddress, stakeAmount, userAddress } = abilityParams;
            // Get PKP credentials from environment
            const pkpPrivateKey = process.env.VINCENT_PKP_PRIVATE_KEY;
            const pkpAddress = delegation.delegatorPkpInfo.ethAddress;
            if (!pkpPrivateKey) {
                return fail({
                    success: false,
                    error: 'PKP_NOT_CONFIGURED',
                    reason: 'PKP private key not configured'
                });
            }
            // Create provider and PKP signer
            const provider = new ethers.providers.JsonRpcProvider('https://sepolia.infura.io/v3/fccd5042681c42b598675d08a67dbaa8');
            const pkpSigner = new ethers.Wallet(pkpPrivateKey, provider);
            // Create contract instance with PKP signer
            const contract = new ethers.Contract(contractAddress, CONTRACT_ABI, pkpSigner);
            console.log(`💰 Staking ${ethers.utils.formatEther(stakeAmount)} ETH to challenge ${challengeId}...`);
            // Estimate gas dynamically for better reliability
            let gasLimit;
            try {
                gasLimit = await contract.estimateGas.joinChallenge(challengeId, { value: stakeAmount });
                // Add 20% buffer to estimated gas to ensure transaction succeeds
                gasLimit = gasLimit.mul(120).div(100);
                console.log(`⛽ Estimated gas: ${gasLimit.toString()}`);
            }
            catch (gasError) {
                console.warn('⚠️ Gas estimation failed, using default gas limit of 300000');
                gasLimit = ethers.BigNumber.from(300000);
            }
            // Execute joinChallenge with PKP signature
            const tx = await contract.joinChallenge(challengeId, {
                value: stakeAmount,
                gasLimit
            });
            console.log('⏳ Waiting for transaction confirmation...');
            const receipt = await tx.wait();
            console.log('✅ Transaction confirmed:', receipt.transactionHash);
            return succeed({
                success: true,
                transactionHash: receipt.transactionHash,
                challengeId: challengeId,
                userAddress: userAddress,
                stakedAmount: stakeAmount,
                blockNumber: receipt.blockNumber,
                message: `Successfully staked ${ethers.utils.formatEther(stakeAmount)} ETH to challenge ${challengeId}`
            });
        }
        catch (error) {
            console.error('❌ Execute failed:', error);
            let reason = error.message || 'Failed to execute auto-stake';
            // Parse common errors
            if (error.message?.includes('insufficient funds')) {
                reason = 'PKP has insufficient funds to cover stake and gas';
            }
            else if (error.message?.includes('user rejected')) {
                reason = 'Transaction was rejected';
            }
            else if (error.message?.includes('gas')) {
                reason = 'Gas estimation failed or transaction ran out of gas';
            }
            return fail({
                success: false,
                error: 'EXECUTE_ERROR',
                reason: reason
            });
        }
    }
});
// Export bundled ability with IPFS CID (deployed on 2025-10-26)
exports.bundledVincentAbility = {
    ipfsCid: 'QmVwkwyJRXJn8sWou7j1ka246bdao4vwnikWgj8N6jDRVf',
    vincentAbility: exports.vincentAbility,
    vincentAbilityApiVersion: '2.0.0',
    metadata: {
        name: 'Auto-Stake for Fitness Challenges',
        description: 'Vincent ability to automatically stake user deposits to fitness challenges on behalf of users',
        version: '1.1.4',
        packageName: '@sogalabhi/ability-automatic-stake',
        packageVersion: '1.1.4',
        abilityName: '@sogalabhi/ability-automatic-stake',
        apiVersion: '2.0.0',
        supportedPolicies: {},
        params: {
            challengeId: 'number - Challenge ID to join',
            userAddress: 'string - User\'s wallet address',
            contractAddress: 'string - Challenge contract address',
            stakeAmount: 'string - Stake amount in wei'
        }
    }
};
//# sourceMappingURL=vincent-ability.js.map