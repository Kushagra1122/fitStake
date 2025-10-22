/**
 * Smart Contract Integration Functions
 * 
 * This file contains all functions to interact with the FitStake smart contract.
 * Import and use these functions in your screens to connect to the blockchain.
 */

import { ethers } from 'ethers';

// Deployed contract address on Sepolia
const CONTRACT_ADDRESS = '0xbaf067fe68f032d9fdc906c6dcb32299baa2404f';

// Sepolia RPC URL for reading blockchain data
const SEPOLIA_RPC_URL = 'https://eth-sepolia.g.alchemy.com/v2/demo'; // Using public endpoint

// Contract ABI from artifacts
const CONTRACT_ABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "uint256", "name": "challengeId", "type": "uint256"},
      {"indexed": true, "internalType": "address", "name": "creator", "type": "address"},
      {"indexed": false, "internalType": "string", "name": "description", "type": "string"},
      {"indexed": false, "internalType": "uint256", "name": "stakeAmount", "type": "uint256"},
      {"indexed": false, "internalType": "uint256", "name": "startTime", "type": "uint256"},
      {"indexed": false, "internalType": "uint256", "name": "endTime", "type": "uint256"},
      {"indexed": false, "internalType": "uint256", "name": "targetDistance", "type": "uint256"}
    ],
    "name": "ChallengeCreated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "uint256", "name": "challengeId", "type": "uint256"},
      {"indexed": false, "internalType": "uint256", "name": "totalWinners", "type": "uint256"},
      {"indexed": false, "internalType": "uint256", "name": "totalLosers", "type": "uint256"}
    ],
    "name": "ChallengeFinalized",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "uint256", "name": "challengeId", "type": "uint256"},
      {"indexed": true, "internalType": "address", "name": "user", "type": "address"},
      {"indexed": false, "internalType": "uint256", "name": "completionTimestamp", "type": "uint256"},
      {"indexed": false, "internalType": "uint256", "name": "distance", "type": "uint256"},
      {"indexed": false, "internalType": "uint256", "name": "duration", "type": "uint256"},
      {"indexed": false, "internalType": "string", "name": "stravaActivityId", "type": "string"}
    ],
    "name": "TaskCompleted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "uint256", "name": "challengeId", "type": "uint256"},
      {"indexed": true, "internalType": "address", "name": "user", "type": "address"},
      {"indexed": false, "internalType": "uint256", "name": "stakedAmount", "type": "uint256"}
    ],
    "name": "UserJoined",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "uint256", "name": "challengeId", "type": "uint256"},
      {"indexed": true, "internalType": "address", "name": "winner", "type": "address"},
      {"indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256"}
    ],
    "name": "WinningsDistributed",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "authorizedOracle",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "string", "name": "description", "type": "string"},
      {"internalType": "uint256", "name": "targetDistance", "type": "uint256"},
      {"internalType": "uint256", "name": "stakeAmount", "type": "uint256"},
      {"internalType": "uint256", "name": "duration", "type": "uint256"}
    ],
    "name": "createChallenge",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "challengeId", "type": "uint256"}],
    "name": "finalizeChallenge",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "challengeId", "type": "uint256"}],
    "name": "getChallenge",
    "outputs": [
      {
        "components": [
          {"internalType": "uint256", "name": "challengeId", "type": "uint256"},
          {"internalType": "address", "name": "creator", "type": "address"},
          {"internalType": "string", "name": "description", "type": "string"},
          {"internalType": "uint256", "name": "targetDistance", "type": "uint256"},
          {"internalType": "uint256", "name": "stakeAmount", "type": "uint256"},
          {"internalType": "uint256", "name": "startTime", "type": "uint256"},
          {"internalType": "uint256", "name": "endTime", "type": "uint256"},
          {"internalType": "uint256", "name": "totalStaked", "type": "uint256"},
          {"internalType": "uint256", "name": "participantCount", "type": "uint256"},
          {"internalType": "bool", "name": "finalized", "type": "bool"}
        ],
        "internalType": "struct ChallengeContract.ChallengeDetails",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "challengeId", "type": "uint256"}],
    "name": "getChallengeParticipants",
    "outputs": [{"internalType": "address[]", "name": "", "type": "address[]"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "uint256", "name": "challengeId", "type": "uint256"},
      {"internalType": "address", "name": "userAddress", "type": "address"}
    ],
    "name": "getParticipant",
    "outputs": [
      {
        "components": [
          {"internalType": "address", "name": "userAddress", "type": "address"},
          {"internalType": "bool", "name": "hasCompleted", "type": "bool"},
          {"internalType": "bool", "name": "hasWithdrawn", "type": "bool"},
          {"internalType": "uint256", "name": "stakedAmount", "type": "uint256"}
        ],
        "internalType": "struct ChallengeContract.Participant",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "uint256", "name": "challengeId", "type": "uint256"},
      {"internalType": "address", "name": "userAddress", "type": "address"}
    ],
    "name": "isParticipant",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "challengeId", "type": "uint256"}],
    "name": "joinChallenge",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "nextChallengeId",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "challengeId", "type": "uint256"}],
    "name": "withdrawWinnings",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

/**
 * Get a provider for reading from the blockchain
 * @returns {object} Ethers provider
 */
export const getProvider = () => {
  return new ethers.JsonRpcProvider(SEPOLIA_RPC_URL);
};

/**
 * Get contract instance
 * @param {object} signerOrProvider - Ethers signer or provider
 * @returns {object} Contract instance
 */
export const getContract = (signerOrProvider) => {
  if (!CONTRACT_ADDRESS) {
    throw new Error('Contract address not set.');
  }
  
  const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signerOrProvider);
  return contract;
};

/**
 * Create a new challenge
 * @param {object} signer - Ethers signer from wallet
 * @param {object} challengeData - Challenge details {description, activityType, targetDistance (km), duration (days), stakeAmount (ETH)}
 * @returns {object} Transaction receipt
 */
export const createChallenge = async (signer, challengeData) => {
  try {
    const contract = getContract(signer);
    
    const { description, targetDistance, duration, stakeAmount } = challengeData;
    
    // Convert values to contract format
    const targetDistanceInMeters = Math.floor(parseFloat(targetDistance) * 1000); // km to meters
    const durationInSeconds = parseInt(duration) * 86400; // days to seconds
    const stakeInWei = ethers.parseEther(stakeAmount.toString());
    
    console.log('Creating challenge:', {
      description,
      targetDistanceInMeters,
      stakeInWei: stakeInWei.toString(),
      durationInSeconds
    });
    
    // Call smart contract - stakeAmount is not sent as value, it's just a parameter
    const tx = await contract.createChallenge(
      description,
      targetDistanceInMeters,
      stakeInWei,
      durationInSeconds
    );
    
    console.log('Transaction sent:', tx.hash);
    
    // Wait for transaction confirmation
    const receipt = await tx.wait();
    
    console.log('Transaction confirmed:', receipt);
    
    // Parse challengeId from events
    let challengeId;
    if (receipt.logs && receipt.logs.length > 0) {
      const iface = new ethers.Interface(CONTRACT_ABI);
      for (const log of receipt.logs) {
        try {
          const parsed = iface.parseLog(log);
          if (parsed && parsed.name === 'ChallengeCreated') {
            challengeId = Number(parsed.args.challengeId);
            break;
          }
        } catch (e) {
          // Skip logs that don't match our interface
        }
      }
    }
    
    return {
      success: true,
      transactionHash: receipt.hash,
      challengeId: challengeId || null,
    };
  } catch (error) {
    console.error('Error creating challenge:', error);
    throw new Error(error.reason || error.message || 'Failed to create challenge');
  }
};

/**
 * Get all active challenges
 * @param {object} provider - Ethers provider (optional)
 * @returns {array} List of active challenges
 */
export const getActiveChallenges = async (provider) => {
  try {
    const prov = provider || getProvider();
    const contract = getContract(prov);
    
    // Get nextChallengeId to know how many challenges exist
    const nextId = await contract.nextChallengeId();
    const numChallenges = Number(nextId) - 1;
    
    if (numChallenges <= 0) {
      return [];
    }
    
    // Fetch all challenges
    const challengePromises = [];
    for (let i = 1; i <= numChallenges; i++) {
      challengePromises.push(
        contract.getChallenge(i).catch(err => {
          console.error(`Error fetching challenge ${i}:`, err);
          return null;
        })
      );
    }
    
    const challenges = await Promise.all(challengePromises);
    
    // Filter and format challenges
    const now = Math.floor(Date.now() / 1000);
    const formattedChallenges = challenges
      .filter(challenge => challenge !== null)
      .filter(challenge => !challenge.finalized && Number(challenge.endTime) > now)
      .map(challenge => {
        const targetDistanceKm = Number(challenge.targetDistance) / 1000; // meters to km
        const durationDays = (Number(challenge.endTime) - Number(challenge.startTime)) / 86400; // seconds to days
        
        return {
          id: Number(challenge.challengeId),
          name: challenge.description,
          description: challenge.description,
          creator: challenge.creator,
          activityType: 'running', // Not stored in contract, default to running
          targetDistance: targetDistanceKm,
          unit: 'km',
          duration: Math.floor(durationDays),
          stakeAmount: ethers.formatEther(challenge.stakeAmount),
          participants: Number(challenge.participantCount),
          deadline: new Date(Number(challenge.endTime) * 1000),
          status: 'active',
          startDate: new Date(Number(challenge.startTime) * 1000),
          endTime: Number(challenge.endTime),
          startTime: Number(challenge.startTime),
          finalized: challenge.finalized,
          totalStaked: ethers.formatEther(challenge.totalStaked),
          icon: '🏃', // Default icon
        };
      });
    
    return formattedChallenges;
  } catch (error) {
    console.error('Error fetching challenges:', error);
    throw new Error(error.reason || error.message || 'Failed to fetch challenges');
  }
};

/**
 * Join an existing challenge
 * @param {object} signer - Ethers signer from wallet
 * @param {number} challengeId - ID of challenge to join
 * @param {string} stakeAmount - Amount to stake in ETH
 * @returns {object} Transaction receipt
 */
export const joinChallenge = async (signer, challengeId, stakeAmount) => {
  try {
    const contract = getContract(signer);
    
    // Convert stake amount to Wei
    const stakeInWei = ethers.parseEther(stakeAmount.toString());
    
    console.log('Joining challenge:', { challengeId, stakeAmount, stakeInWei: stakeInWei.toString() });
    
    // Call smart contract with value
    const tx = await contract.joinChallenge(challengeId, { value: stakeInWei });
    
    console.log('Transaction sent:', tx.hash);
    
    // Wait for transaction confirmation
    const receipt = await tx.wait();
    
    console.log('Transaction confirmed:', receipt);
    
    return {
      success: true,
      transactionHash: receipt.hash,
    };
  } catch (error) {
    console.error('Error joining challenge:', error);
    throw new Error(error.reason || error.message || 'Failed to join challenge');
  }
};

/**
 * Get user's challenges
 * @param {object} provider - Ethers provider (optional)
 * @param {string} userAddress - User's wallet address
 * @returns {array} List of user's challenges
 */
export const getUserChallenges = async (provider, userAddress) => {
  try {
    const prov = provider || getProvider();
    const contract = getContract(prov);
    
    // Get nextChallengeId to know how many challenges exist
    const nextId = await contract.nextChallengeId();
    const numChallenges = Number(nextId) - 1;
    
    if (numChallenges <= 0) {
      return [];
    }
    
    // Check each challenge to see if user is a participant
    const userChallengePromises = [];
    for (let i = 1; i <= numChallenges; i++) {
      userChallengePromises.push(
        (async () => {
          try {
            const isParticipant = await contract.isParticipant(i, userAddress);
            if (!isParticipant) {
              return null;
            }
            
            const [challenge, participant] = await Promise.all([
              contract.getChallenge(i),
              contract.getParticipant(i, userAddress)
            ]);
            
            return { challenge, participant };
          } catch (err) {
            console.error(`Error fetching challenge ${i} for user:`, err);
            return null;
          }
        })()
      );
    }
    
    const results = await Promise.all(userChallengePromises);
    
    // Format challenges for UI
    const formattedChallenges = results
      .filter(result => result !== null)
      .map(({ challenge, participant }) => {
        const targetDistanceKm = Number(challenge.targetDistance) / 1000; // meters to km
        const durationDays = (Number(challenge.endTime) - Number(challenge.startTime)) / 86400; // seconds to days
        
        return {
          id: Number(challenge.challengeId),
          name: challenge.description,
          description: challenge.description,
          activityType: 'running', // Not stored in contract
          targetDistance: targetDistanceKm,
          currentProgress: 0, // TODO: Calculate from activities
          unit: 'km',
          duration: Math.floor(durationDays),
          stakeAmount: ethers.formatEther(participant.stakedAmount),
          deadline: new Date(Number(challenge.endTime) * 1000),
          status: challenge.finalized ? 'finalized' : 'active',
          isCompleted: participant.hasCompleted,
          hasWithdrawn: participant.hasWithdrawn,
          finalized: challenge.finalized,
          startDate: new Date(Number(challenge.startTime) * 1000),
          endTime: Number(challenge.endTime),
          startTime: Number(challenge.startTime),
          icon: '🏃', // Default icon
        };
      });
    
    return formattedChallenges;
  } catch (error) {
    console.error('Error fetching user challenges:', error);
    throw new Error(error.reason || error.message || 'Failed to fetch user challenges');
  }
};

/**
 * Withdraw winnings from a completed challenge
 * @param {object} signer - Ethers signer from wallet
 * @param {number} challengeId - ID of challenge to withdraw from
 * @returns {object} Transaction receipt
 */
export const withdrawWinnings = async (signer, challengeId) => {
  try {
    const contract = getContract(signer);
    
    console.log('Withdrawing winnings from challenge:', challengeId);
    
    // Call smart contract
    const tx = await contract.withdrawWinnings(challengeId);
    
    console.log('Transaction sent:', tx.hash);
    
    // Wait for transaction confirmation
    const receipt = await tx.wait();
    
    console.log('Transaction confirmed:', receipt);
    
    return {
      success: true,
      transactionHash: receipt.hash,
    };
  } catch (error) {
    console.error('Error withdrawing winnings:', error);
    throw new Error(error.reason || error.message || 'Failed to withdraw winnings');
  }
};

// Alias for backward compatibility
export const completeChallenge = withdrawWinnings;

/**
 * Finalize a challenge (anyone can call after endTime)
 * @param {object} signer - Ethers signer from wallet
 * @param {number} challengeId - ID of challenge to finalize
 * @returns {object} Transaction receipt
 */
export const finalizeChallenge = async (signer, challengeId) => {
  try {
    const contract = getContract(signer);
    
    console.log('Finalizing challenge:', challengeId);
    
    const tx = await contract.finalizeChallenge(challengeId);
    
    console.log('Transaction sent:', tx.hash);
    
    const receipt = await tx.wait();
    
    console.log('Transaction confirmed:', receipt);
    
    return {
      success: true,
      transactionHash: receipt.hash,
    };
  } catch (error) {
    console.error('Error finalizing challenge:', error);
    throw new Error(error.reason || error.message || 'Failed to finalize challenge');
  }
};

/**
 * Get challenge details by ID
 * @param {object} provider - Ethers provider (optional)
 * @param {number} challengeId - Challenge ID
 * @returns {object} Challenge details
 */
export const getChallengeById = async (provider, challengeId) => {
  try {
    const prov = provider || getProvider();
    const contract = getContract(prov);
    
    // Call smart contract
    const challenge = await contract.getChallenge(challengeId);
    
    const targetDistanceKm = Number(challenge.targetDistance) / 1000; // meters to km
    const durationDays = (Number(challenge.endTime) - Number(challenge.startTime)) / 86400; // seconds to days
    
    // Format challenge for UI
    return {
      id: Number(challenge.challengeId),
      name: challenge.description,
      description: challenge.description,
      creator: challenge.creator,
      activityType: 'running', // Not stored in contract
      targetDistance: targetDistanceKm,
      unit: 'km',
      duration: Math.floor(durationDays),
      stakeAmount: ethers.formatEther(challenge.stakeAmount),
      participants: Number(challenge.participantCount),
      deadline: new Date(Number(challenge.endTime) * 1000),
      status: challenge.finalized ? 'finalized' : 'active',
      startDate: new Date(Number(challenge.startTime) * 1000),
      finalized: challenge.finalized,
      totalStaked: ethers.formatEther(challenge.totalStaked),
      icon: '🏃',
    };
  } catch (error) {
    console.error('Error fetching challenge:', error);
    throw new Error(error.reason || error.message || 'Failed to fetch challenge details');
  }
};

export default {
  getProvider,
  getContract,
  createChallenge,
  getActiveChallenges,
  joinChallenge,
  getUserChallenges,
  withdrawWinnings,
  completeChallenge,
  finalizeChallenge,
  getChallengeById,
};
