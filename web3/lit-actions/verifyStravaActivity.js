/**
 * Lit Action: verifyStravaActivity.js
 * 
 * This Lit Action verifies Strava running activities against challenge criteria
 * and prepares signed transactions to mark task completion on-chain.
 * 
 * Pure JavaScript - Lit Actions don't support TypeScript
 */

const verifyStravaActivity = async () => {
  try {
    // 1. Get input parameters
    const { 
      challengeId, 
      userAddress, 
      contractAddress, 
      mockActivityData,
      stravaAccessToken 
    } = Lit.Actions.getParams();

    console.log('Starting Strava activity verification...');
    console.log('Challenge ID:', challengeId);
    console.log('User Address:', userAddress);
    console.log('Contract Address:', contractAddress);

    // 2. Fetch challenge details from contract (read-only call)
    const challenge = await fetchChallengeDetails(contractAddress, challengeId);
    if (!challenge) {
      return {
        success: false,
        reason: 'Challenge not found'
      };
    }

    console.log('Challenge details:', {
      targetDistance: challenge.targetDistance,
      startTime: challenge.startTime,
      endTime: challenge.endTime,
      stakeAmount: challenge.stakeAmount
    });

    // 3. Fetch Strava activity data
    let activityData;
    if (mockActivityData) {
      // Use mock data for testing
      activityData = mockActivityData;
      console.log('Using mock activity data');
    } else if (stravaAccessToken) {
      // Fetch from real Strava API
      activityData = await fetchStravaActivity(stravaAccessToken);
      if (!activityData) {
        return {
          success: false,
          reason: 'Failed to fetch Strava activity'
        };
      }
      console.log('Fetched real Strava activity:', activityData.id);
    } else {
      return {
        success: false,
        reason: 'No activity data provided (mock or real)'
      };
    }

    // 4. Validate activity against challenge criteria
    const validationResult = validateActivity(activityData, challenge);
    console.log('Validation result:', validationResult);

    if (!validationResult.success) {
      return {
        success: false,
        reason: validationResult.reason,
        verificationResult: validationResult
      };
    }

    // 5. Encode markTaskComplete transaction
    const txData = encodeMarkTaskComplete(challengeId, userAddress);
    console.log('Encoded transaction data:', txData);

    // 6. Sign transaction with PKP
    const signature = await Lit.Actions.signEcdsa({
      toSign: txData,
      publicKey: Lit.Actions.getPublicKey(),
      sigName: 'stravaVerificationSig'
    });

    console.log('Transaction signed successfully');

    // 7. Return success response
    return {
      success: true,
      signature: signature,
      txData: txData,
      verificationResult: validationResult,
      activityId: activityData.id,
      distance: activityData.distance,
      activityType: activityData.type
    };

  } catch (error) {
    console.error('Error in verifyStravaActivity:', error);
    return {
      success: false,
      reason: `Lit Action error: ${error.message}`
    };
  }
};

/**
 * Fetch challenge details from the smart contract
 */
async function fetchChallengeDetails(contractAddress, challengeId) {
  try {
    // This would be a read-only contract call
    // For now, we'll simulate the challenge data structure
    // In a real implementation, this would call the contract's getChallenge function
    
    // Simulated challenge data (in real implementation, fetch from contract)
    const challenge = {
      challengeId: challengeId,
      targetDistance: 5000, // 5km in meters
      startTime: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
      endTime: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
      stakeAmount: '1000000000000000000', // 1 ETH in wei
      creator: '0x1234567890123456789012345678901234567890',
      description: 'Run 5km today',
      finalized: false
    };

    return challenge;
  } catch (error) {
    console.error('Error fetching challenge details:', error);
    return null;
  }
}

/**
 * Fetch Strava activity from API
 */
async function fetchStravaActivity(accessToken) {
  try {
    // In Phase 2, we'll use mock data
    // In Phase 3, this would make real API calls to Strava
    
    const response = await fetch('http://localhost:3001/athlete/activities', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Strava API error: ${response.status}`);
    }

    const activities = await response.json();
    
    // Return the most recent activity
    if (activities && activities.length > 0) {
      return activities[0];
    }

    return null;
  } catch (error) {
    console.error('Error fetching Strava activity:', error);
    return null;
  }
}

/**
 * Validate activity against challenge criteria
 */
function validateActivity(activity, challenge) {
  const result = {
    success: true,
    reason: '',
    isValidDistance: false,
    isValidType: false,
    isValidTimestamp: false,
    activityId: activity.id,
    distance: activity.distance,
    activityType: activity.type,
    timestamp: new Date(activity.start_date).getTime() / 1000
  };

  // Check activity type
  if (activity.type !== 'Run') {
    result.success = false;
    result.reason = `Invalid activity type: ${activity.type}. Expected: Run`;
    return result;
  }
  result.isValidType = true;

  // Check distance meets requirement
  if (activity.distance < challenge.targetDistance) {
    result.success = false;
    result.reason = `Distance too short: ${activity.distance}m. Required: ${challenge.targetDistance}m`;
    return result;
  }
  result.isValidDistance = true;

  // Check timestamp within challenge window
  const activityTime = new Date(activity.start_date).getTime() / 1000;
  if (activityTime < challenge.startTime) {
    result.success = false;
    result.reason = `Activity too early: ${new Date(activity.start_date).toISOString()}. Challenge starts: ${new Date(challenge.startTime * 1000).toISOString()}`;
    return result;
  }

  if (activityTime > challenge.endTime) {
    result.success = false;
    result.reason = `Activity too late: ${new Date(activity.start_date).toISOString()}. Challenge ends: ${new Date(challenge.endTime * 1000).toISOString()}`;
    return result;
  }
  result.isValidTimestamp = true;

  result.reason = 'Activity validation successful';
  return result;
}

/**
 * Encode markTaskComplete transaction
 */
function encodeMarkTaskComplete(challengeId, userAddress) {
  // This would encode the actual contract function call
  // For now, we'll create a simple hash of the parameters
  
  const data = {
    function: 'markTaskComplete',
    challengeId: challengeId,
    userAddress: userAddress,
    timestamp: Date.now()
  };

  // In a real implementation, this would use ethers.js or similar
  // to encode the function call with proper ABI
  const encodedData = JSON.stringify(data);
  
  // For testing, we'll return a hash of the data
  // In production, this would be the actual transaction hash
  return btoa(encodedData); // Simple base64 encoding for demo
}

// Export the main function
Lit.Actions.setResponse({ response: JSON.stringify(verifyStravaActivity()) });
