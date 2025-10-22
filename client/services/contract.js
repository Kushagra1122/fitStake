/**
 * Smart Contract Integration Functions
 * 
 * This file contains all functions to interact with the FitStake smart contract.
 * Import and use these functions in your screens to connect to the blockchain.
 */

import { ethers } from 'ethers';

// TODO: Add your deployed contract address here
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || '0xbaf067fe68f032d9fdc906c6dcb32299baa240';

// TODO: Add your contract ABI here
// You can get this from the compiled contract artifacts
const CONTRACT_ABI = [
  // Example functions - replace with your actual ABI
  // "function createChallenge(string memory name, string memory activityType, uint256 target, uint256 duration) public payable",
  // "function joinChallenge(uint256 challengeId) public payable",
  // "function getActiveChallenges() public view returns (Challenge[] memory)",
  // "function getUserChallenges(address user) public view returns (Challenge[] memory)",
  // "function completeChallenge(uint256 challengeId) public",
];

/**
 * Get contract instance
 * @param {object} provider - Ethers provider or signer
 * @returns {object} Contract instance
 */
export const getContract = async (provider) => {
  if (!CONTRACT_ADDRESS) {
    throw new Error('Contract address not set. Please add CONTRACT_ADDRESS to your environment variables.');
  }
  
  const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
  return contract;
};

/**
 * Create a new challenge
 * @param {object} signer - Ethers signer from wallet
 * @param {object} challengeData - Challenge details
 * @returns {object} Transaction receipt
 */
export const createChallenge = async (signer, challengeData) => {
  try {
    const contract = await getContract(signer);
    
    const { name, activityType, targetDistance, duration, stakeAmount } = challengeData;
    
    // Convert stake amount to Wei
    const stakeInWei = ethers.parseEther(stakeAmount.toString());
    
    // Call smart contract
    const tx = await contract.createChallenge(
      name,
      activityType,
      targetDistance,
      duration,
      { value: stakeInWei }
    );
    
    // Wait for transaction confirmation
    const receipt = await tx.wait();
    
    return {
      success: true,
      transactionHash: receipt.hash,
      challengeId: receipt.events?.[0]?.args?.challengeId?.toNumber(),
    };
  } catch (error) {
    console.error('Error creating challenge:', error);
    throw new Error(error.message || 'Failed to create challenge');
  }
};

/**
 * Get all active challenges
 * @param {object} provider - Ethers provider
 * @returns {array} List of active challenges
 */
export const getActiveChallenges = async (provider) => {
  try {
    const contract = await getContract(provider);
    
    // Call smart contract
    const challenges = await contract.getActiveChallenges();
    
    // Format challenges for UI
    const formattedChallenges = challenges.map((challenge, index) => ({
      id: challenge.id?.toNumber() || index,
      name: challenge.name || '',
      creator: challenge.creator || '',
      activityType: challenge.activityType || 'running',
      targetDistance: challenge.targetDistance?.toNumber() || 0,
      unit: challenge.unit || 'km',
      duration: challenge.duration?.toNumber() || 0,
      stakeAmount: challenge.stakeAmount ? ethers.formatEther(challenge.stakeAmount) : '0',
      participants: challenge.participants?.toNumber() || 0,
      deadline: challenge.deadline ? new Date(challenge.deadline.toNumber() * 1000) : new Date(),
      status: challenge.status || 'active',
      startDate: challenge.startDate ? new Date(challenge.startDate.toNumber() * 1000) : new Date(),
    }));
    
    return formattedChallenges;
  } catch (error) {
    console.error('Error fetching challenges:', error);
    throw new Error(error.message || 'Failed to fetch challenges');
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
    const contract = await getContract(signer);
    
    // Convert stake amount to Wei
    const stakeInWei = ethers.parseEther(stakeAmount.toString());
    
    // Call smart contract
    const tx = await contract.joinChallenge(challengeId, { value: stakeInWei });
    
    // Wait for transaction confirmation
    const receipt = await tx.wait();
    
    return {
      success: true,
      transactionHash: receipt.hash,
    };
  } catch (error) {
    console.error('Error joining challenge:', error);
    throw new Error(error.message || 'Failed to join challenge');
  }
};

/**
 * Get user's challenges
 * @param {object} provider - Ethers provider
 * @param {string} userAddress - User's wallet address
 * @returns {array} List of user's challenges
 */
export const getUserChallenges = async (provider, userAddress) => {
  try {
    const contract = await getContract(provider);
    
    // Call smart contract
    const challenges = await contract.getUserChallenges(userAddress);
    
    // Format challenges for UI
    const formattedChallenges = challenges.map((challenge, index) => ({
      id: challenge.id?.toNumber() || index,
      name: challenge.name || '',
      activityType: challenge.activityType || 'running',
      targetDistance: challenge.targetDistance?.toNumber() || 0,
      currentProgress: challenge.currentProgress?.toNumber() || 0,
      unit: challenge.unit || 'km',
      duration: challenge.duration?.toNumber() || 0,
      stakeAmount: challenge.stakeAmount ? ethers.formatEther(challenge.stakeAmount) : '0',
      deadline: challenge.deadline ? new Date(challenge.deadline.toNumber() * 1000) : new Date(),
      status: challenge.status || 'active',
      isCompleted: challenge.isCompleted || false,
    }));
    
    return formattedChallenges;
  } catch (error) {
    console.error('Error fetching user challenges:', error);
    throw new Error(error.message || 'Failed to fetch user challenges');
  }
};

/**
 * Complete a challenge (claim rewards)
 * @param {object} signer - Ethers signer from wallet
 * @param {number} challengeId - ID of challenge to complete
 * @returns {object} Transaction receipt
 */
export const completeChallenge = async (signer, challengeId) => {
  try {
    const contract = await getContract(signer);
    
    // Call smart contract
    const tx = await contract.completeChallenge(challengeId);
    
    // Wait for transaction confirmation
    const receipt = await tx.wait();
    
    return {
      success: true,
      transactionHash: receipt.hash,
    };
  } catch (error) {
    console.error('Error completing challenge:', error);
    throw new Error(error.message || 'Failed to complete challenge');
  }
};

/**
 * Get challenge details by ID
 * @param {object} provider - Ethers provider
 * @param {number} challengeId - Challenge ID
 * @returns {object} Challenge details
 */
export const getChallengeById = async (provider, challengeId) => {
  try {
    const contract = await getContract(provider);
    
    // Call smart contract
    const challenge = await contract.getChallengeById(challengeId);
    
    // Format challenge for UI
    return {
      id: challenge.id?.toNumber() || challengeId,
      name: challenge.name || '',
      creator: challenge.creator || '',
      activityType: challenge.activityType || 'running',
      targetDistance: challenge.targetDistance?.toNumber() || 0,
      unit: challenge.unit || 'km',
      duration: challenge.duration?.toNumber() || 0,
      stakeAmount: challenge.stakeAmount ? ethers.formatEther(challenge.stakeAmount) : '0',
      participants: challenge.participants?.toNumber() || 0,
      deadline: challenge.deadline ? new Date(challenge.deadline.toNumber() * 1000) : new Date(),
      status: challenge.status || 'active',
    };
  } catch (error) {
    console.error('Error fetching challenge:', error);
    throw new Error(error.message || 'Failed to fetch challenge details');
  }
};

export default {
  getContract,
  createChallenge,
  getActiveChallenges,
  joinChallenge,
  getUserChallenges,
  completeChallenge,
  getChallengeById,
};
