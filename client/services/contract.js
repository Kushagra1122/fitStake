/**
 * Smart Contract Integration Functions
 * 
 * This file contains all functions to interact with the FitStake smart contract.
 * Import and use these functions in your screens to connect to the blockchain.
 */

import { ethers } from 'ethers';

// Deployed contract address on Sepolia
const CONTRACT_ADDRESS = '0xe38d8f585936c60ecb7bfae7297457f6a35058bb';

// Sepolia RPC URL for reading blockchain data
const SEPOLIA_RPC_URL = 'https://sepolia.infura.io/v3/fccd5042681c42b598675d08a67dbaa8'; // Using Infura endpoint (matches MetaMask's built-in Sepolia)

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
  },
  {
    "inputs": [{"internalType": "address", "name": "userAddress", "type": "address"}],
    "name": "getUserChallenges",
    "outputs": [{"internalType": "uint256[]", "name": "", "type": "uint256[]"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "userAddress", "type": "address"}],
    "name": "getUserChallengeDetails",
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
        "internalType": "struct ChallengeContract.ChallengeDetails[]",
        "name": "",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "uint256", "name": "challengeId", "type": "uint256"},
      {"internalType": "address", "name": "userAddress", "type": "address"},
      {"internalType": "uint256", "name": "completionTimestamp", "type": "uint256"},
      {"internalType": "uint256", "name": "distance", "type": "uint256"},
      {"internalType": "uint256", "name": "duration", "type": "uint256"},
      {"internalType": "string", "name": "stravaActivityId", "type": "string"}
    ],
    "name": "markTaskComplete",
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
 * @param {object} walletConnectInfo - WalletConnect session info (optional)
 * @returns {object} Transaction receipt
 */
export const createChallenge = async (signer, challengeData, walletConnectInfo = null) => {
  try {
    console.log('🔧 Contract service: Starting createChallenge');
    console.log('📊 Input challengeData:', challengeData);
    
    // Check if we have WalletConnect session info
    console.log('🔍 Checking signer type...');
    if (!signer.address || !signer.provider) {
      throw new Error('Invalid signer - missing address or provider');
    }
    
    console.log('📋 Getting contract instance...');
    const contract = getContract(signer);
    console.log('✅ Contract instance obtained:', {
      address: contract.target,
      signer: signer.address
    });
    
    // Test contract connectivity
    console.log('🔍 Testing contract connectivity...');
    try {
      const nextChallengeId = await contract.nextChallengeId();
      console.log('✅ Contract is accessible, nextChallengeId:', nextChallengeId.toString());
    } catch (connectError) {
      console.error('❌ Contract connectivity test failed:', connectError);
      throw new Error(`Contract not accessible: ${connectError.message}`);
    }
    
    // Check user's ETH balance
    console.log('💰 Checking user ETH balance...');
    try {
      const balance = await signer.provider.getBalance(signer.address);
      console.log('✅ User balance:', {
        wei: balance.toString(),
        eth: ethers.formatEther(balance)
      });
      
      if (balance < ethers.parseEther("0.001")) {
        console.warn('⚠️ Low ETH balance, might not have enough for gas');
      }
    } catch (balanceError) {
      console.warn('⚠️ Could not check balance:', balanceError.message);
    }
    
    const { description, targetDistance, duration, stakeAmount } = challengeData;
    
    // Convert values to contract format
    console.log('🔄 Converting values to contract format...');
    const targetDistanceInMeters = Math.floor(parseFloat(targetDistance) * 1000); // km to meters
    const durationInSeconds = parseInt(duration) * 86400; // days to seconds
    const stakeInWei = ethers.parseEther(stakeAmount.toString());
    
    console.log('📊 Converted values:', {
      description,
      targetDistance: `${targetDistance} km → ${targetDistanceInMeters} meters`,
      duration: `${duration} days → ${durationInSeconds} seconds`,
      stakeAmount: `${stakeAmount} ETH → ${stakeInWei.toString()} wei`
    });
    
    console.log('📤 Calling smart contract createChallenge function...');
    console.log('🔧 Contract method parameters:', {
      description,
      targetDistanceInMeters,
      stakeInWei: stakeInWei.toString(),
      durationInSeconds
    });
    
    // Check if we have enough gas
    console.log('⛽ Checking gas estimation...');
    try {
      const gasEstimate = await contract.createChallenge.estimateGas(
        description,
        targetDistanceInMeters,
        stakeInWei,
        durationInSeconds
      );
      console.log('✅ Gas estimation successful:', {
        estimatedGas: gasEstimate.toString(),
        gasInGwei: (gasEstimate * 20n / 1000000000n).toString() // Rough ETH cost
      });
    } catch (gasError) {
      console.error('❌ Gas estimation failed:', gasError);
      throw new Error(`Gas estimation failed: ${gasError.message}`);
    }
    
    // Call smart contract - stakeAmount is not sent as value, it's just a parameter
    console.log('📞 Sending transaction to blockchain...');
    console.log('🔍 Transaction details before sending:', {
      from: signer.address,
      to: contract.target,
      gasLimit: 'auto',
      value: '0' // No ETH being sent, just a parameter
    });
    
    let tx;
    try {
      console.log('⏰ Starting transaction with 60-second timeout...');
      
      if (walletConnectInfo) {
        console.log('🔗 Using WalletConnect for transaction...');
        console.log('📱 This should open MetaMask for approval!');
        
        // Use WalletConnect directly for the contract call
        const txHash = await walletConnectInfo.signClient.request({
          topic: walletConnectInfo.session.topic,
          chainId: `eip155:${walletConnectInfo.chainId}`,
          request: {
            method: 'eth_sendTransaction',
            params: [{
              from: walletConnectInfo.account,
              to: contract.target,
              data: contract.interface.encodeFunctionData('createChallenge', [
                description,
                targetDistanceInMeters,
                stakeInWei,
                durationInSeconds
              ]),
              value: '0x0'
            }],
          },
        });
        
        console.log('✅ WalletConnect transaction sent:', txHash);
        
        // Create a mock transaction object for compatibility
        tx = {
          hash: txHash,
          from: walletConnectInfo.account,
          to: contract.target,
          wait: async () => {
            console.log('⏳ Waiting for transaction confirmation via WalletConnect...');
            // Wait for confirmation using the provider
            const provider = getProvider();
            const receipt = await provider.waitForTransaction(txHash);
            return receipt;
          }
        };
      } else {
        console.log('📞 Using standard ethers contract call...');
        
        // Add timeout to the transaction call itself
        const txPromise = contract.createChallenge(
          description,
          targetDistanceInMeters,
          stakeInWei,
          durationInSeconds
        );
        
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Transaction call timed out after 60 seconds - check if MetaMask is open and approve the transaction')), 60000);
        });
        
        tx = await Promise.race([txPromise, timeoutPromise]);
        console.log('✅ Transaction object created successfully');
      }
    } catch (txError) {
      console.error('❌ Failed to create transaction:', txError);
      console.error('❌ Transaction error details:', {
        message: txError.message,
        reason: txError.reason,
        code: txError.code,
        data: txError.data
      });
      
      // Provide helpful error messages
      if (txError.message.includes('User rejected')) {
        throw new Error('Transaction was rejected by user. Please try again and approve the transaction in MetaMask.');
      } else if (txError.message.includes('timed out')) {
        throw new Error('Transaction timed out. Please check if MetaMask is open and approve the transaction, then try again.');
      } else if (txError.message.includes('insufficient funds')) {
        throw new Error('Insufficient funds for gas. Please add more ETH to your wallet.');
      } else {
        throw new Error(`Transaction failed: ${txError.message}`);
      }
    }
    
    console.log('✅ Transaction sent successfully!');
    console.log('📄 Transaction details:', {
      hash: tx.hash,
      from: tx.from,
      to: tx.to,
      gasLimit: tx.gasLimit?.toString(),
      gasPrice: tx.gasPrice?.toString()
    });
    
    // Wait for transaction confirmation with timeout
    console.log('⏳ Waiting for transaction confirmation...');
    console.log('🔗 Transaction hash:', tx.hash);
    console.log('🌐 View on Sepolia Etherscan:', `https://sepolia.etherscan.io/tx/${tx.hash}`);
    
    // Add timeout to prevent hanging
    const receiptPromise = tx.wait();
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Transaction confirmation timed out after 2 minutes')), 120000);
    });
    
    const receipt = await Promise.race([receiptPromise, timeoutPromise]);
    
    console.log('✅ Transaction confirmed!');
    console.log('📄 Receipt details:', {
      blockNumber: receipt.blockNumber,
      blockHash: receipt.blockHash,
      gasUsed: receipt.gasUsed?.toString(),
      status: receipt.status,
      logsCount: receipt.logs?.length || 0
    });
    
    // Parse challengeId from events
    console.log('🔍 Parsing events from transaction receipt...');
    let challengeId;
    if (receipt.logs && receipt.logs.length > 0) {
      console.log(`📋 Found ${receipt.logs.length} logs in transaction`);
      const iface = new ethers.Interface(CONTRACT_ABI);
      for (const log of receipt.logs) {
        try {
          const parsed = iface.parseLog(log);
          console.log('📄 Parsed log:', {
            name: parsed?.name,
            args: parsed?.args
          });
          if (parsed && parsed.name === 'ChallengeCreated') {
            challengeId = Number(parsed.args.challengeId);
            console.log('✅ Found ChallengeCreated event with ID:', challengeId);
            break;
          }
        } catch (e) {
          console.log('⚠️ Could not parse log:', e.message);
          // Skip logs that don't match our interface
        }
      }
    } else {
      console.log('⚠️ No logs found in transaction receipt');
    }
    
    console.log('🎉 Challenge creation completed successfully!');
    console.log('📤 Returning result:', {
      success: true,
      transactionHash: receipt.hash,
      challengeId: challengeId || null,
    });
    
    return {
      success: true,
      transactionHash: receipt.hash,
      challengeId: challengeId || null,
    };
  } catch (error) {
    console.error('❌ Error creating challenge:', error);
    console.error('❌ Error details:', {
      message: error.message,
      reason: error.reason,
      code: error.code,
      stack: error.stack
    });
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
 * @param {object} walletConnectInfo - WalletConnect session info (optional)
 * @returns {object} Transaction receipt
 */
export const joinChallenge = async (signer, challengeId, stakeAmount, walletConnectInfo = null) => {
  try {
    console.log('🔧 Contract service: Starting joinChallenge');
    console.log('📊 Input data:', { challengeId, stakeAmount });
    
    const contract = getContract(signer);
    
    // Convert stake amount to Wei
    const stakeInWei = ethers.parseEther(stakeAmount.toString());
    
    console.log('Joining challenge:', { challengeId, stakeAmount, stakeInWei: stakeInWei.toString() });
    
    let tx;
    if (walletConnectInfo) {
      console.log('🔗 Using WalletConnect for joinChallenge...');
      console.log('📱 This should open MetaMask for approval!');
      
      // Use WalletConnect directly for the contract call
      const txHash = await walletConnectInfo.signClient.request({
        topic: walletConnectInfo.session.topic,
        chainId: `eip155:${walletConnectInfo.chainId}`,
        request: {
          method: 'eth_sendTransaction',
          params: [{
            from: walletConnectInfo.account,
            to: contract.target,
            data: contract.interface.encodeFunctionData('joinChallenge', [challengeId]),
            value: `0x${stakeInWei.toString(16)}`
          }],
        },
      });
      
      console.log('✅ WalletConnect transaction sent:', txHash);
      
      // Create a mock transaction object for compatibility
      tx = {
        hash: txHash,
        from: walletConnectInfo.account,
        to: contract.target,
        wait: async () => {
          console.log('⏳ Waiting for transaction confirmation via WalletConnect...');
          const provider = getProvider();
          const receipt = await provider.waitForTransaction(txHash);
          return receipt;
        }
      };
    } else {
      // Fallback to standard ethers call
      tx = await contract.joinChallenge(challengeId, { value: stakeInWei });
    }
    
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
 * @param {object} walletConnectInfo - WalletConnect session info (optional)
 * @returns {object} Transaction receipt
 */
export const withdrawWinnings = async (signer, challengeId, walletConnectInfo = null) => {
  try {
    console.log('🔧 Contract service: Starting withdrawWinnings');
    console.log('📊 Input data:', { challengeId });
    
    const contract = getContract(signer);
    
    console.log('Withdrawing winnings from challenge:', challengeId);
    
    let tx;
    if (walletConnectInfo) {
      console.log('🔗 Using WalletConnect for withdrawWinnings...');
      console.log('📱 This should open MetaMask for approval!');
      
      // Use WalletConnect directly for the contract call
      const txHash = await walletConnectInfo.signClient.request({
        topic: walletConnectInfo.session.topic,
        chainId: `eip155:${walletConnectInfo.chainId}`,
        request: {
          method: 'eth_sendTransaction',
          params: [{
            from: walletConnectInfo.account,
            to: contract.target,
            data: contract.interface.encodeFunctionData('withdrawWinnings', [challengeId]),
            value: '0x0'
          }],
        },
      });
      
      console.log('✅ WalletConnect transaction sent:', txHash);
      
      // Create a mock transaction object for compatibility
      tx = {
        hash: txHash,
        from: walletConnectInfo.account,
        to: contract.target,
        wait: async () => {
          console.log('⏳ Waiting for transaction confirmation via WalletConnect...');
          const provider = getProvider();
          const receipt = await provider.waitForTransaction(txHash);
          return receipt;
        }
      };
    } else {
      // Fallback to standard ethers call
      tx = await contract.withdrawWinnings(challengeId);
    }
    
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
export const finalizeChallenge = async (signer, challengeId, walletConnectInfo = null) => {
  try {
    console.log('🔧 Contract service: Starting finalizeChallenge');
    console.log('📊 Input data:', { challengeId });
    
    const contract = getContract(signer);
    
    console.log('Finalizing challenge:', challengeId);
    
    let tx;
    if (walletConnectInfo) {
      console.log('🔗 Using WalletConnect for finalizeChallenge...');
      console.log('📱 This should open MetaMask for approval!');
      
      // Use WalletConnect directly for the contract call
      const txHash = await walletConnectInfo.signClient.request({
        topic: walletConnectInfo.session.topic,
        chainId: `eip155:${walletConnectInfo.chainId}`,
        request: {
          method: 'eth_sendTransaction',
          params: [{
            from: walletConnectInfo.account,
            to: contract.target,
            data: contract.interface.encodeFunctionData('finalizeChallenge', [challengeId]),
            value: '0x0'
          }],
        },
      });
      
      console.log('✅ WalletConnect transaction sent:', txHash);
      
      // Create a mock transaction object for compatibility
      tx = {
        hash: txHash,
        from: walletConnectInfo.account,
        to: contract.target,
        wait: async () => {
          console.log('⏳ Waiting for transaction confirmation via WalletConnect...');
          const provider = getProvider();
          const receipt = await provider.waitForTransaction(txHash);
          return receipt;
        }
      };
    } else {
      // Fallback to standard ethers call
      tx = await contract.finalizeChallenge(challengeId);
    }
    
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

/**
 * Get all challenge IDs that a user has enrolled in
 * @param {object} provider - Ethers provider (optional)
 * @param {string} userAddress - User's wallet address
 * @returns {number[]} Array of challenge IDs
 */
export const getUserChallengeIds = async (provider, userAddress) => {
  try {
    const prov = provider || getProvider();
    const contract = getContract(prov);
    const challengeIds = await contract.getUserChallenges(userAddress);
    
    return challengeIds.map(id => Number(id));
  } catch (error) {
    console.error('Error fetching user challenge IDs:', error);
    throw new Error(error.reason || error.message || 'Failed to fetch user challenges');
  }
};

/**
 * Get detailed information about all challenges a user has enrolled in
 * @param {object} provider - Ethers provider (optional)
 * @param {string} userAddress - User's wallet address
 * @returns {object[]} Array of challenge details with participant info
 */
export const getUserChallengeDetails = async (provider, userAddress) => {
  try {
    const prov = provider || getProvider();
    const contract = getContract(prov);
    const challenges = await contract.getUserChallengeDetails(userAddress);
    
    // Get participant details for each challenge
    const userChallenges = await Promise.all(
      challenges.map(async (challenge) => {
        try {
          const participant = await contract.getParticipant(challenge.challengeId, userAddress);
          
          const targetDistanceKm = Number(challenge.targetDistance) / 1000; // meters to km
          const durationDays = (Number(challenge.endTime) - Number(challenge.startTime)) / 86400; // seconds to days
          
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
            startTime: Number(challenge.startTime),
            endTime: Number(challenge.endTime),
            totalStaked: ethers.formatEther(challenge.totalStaked),
            participantCount: Number(challenge.participantCount),
            finalized: challenge.finalized,
            participant: {
              userAddress: participant.userAddress,
              hasCompleted: participant.hasCompleted,
              hasWithdrawn: participant.hasWithdrawn,
              stakedAmount: ethers.formatEther(participant.stakedAmount),
            }
          };
        } catch (err) {
          console.error(`Error fetching participant details for challenge ${challenge.challengeId}:`, err);
          return null;
        }
      })
    );
    
    return userChallenges.filter(challenge => challenge !== null);
  } catch (error) {
    console.error('Error fetching user challenge details:', error);
    throw new Error(error.reason || error.message || 'Failed to fetch user challenge details');
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
  getUserChallengeIds,
  getUserChallengeDetails,
};
