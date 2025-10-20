/**
 * Lit Action Helper Functions
 * 
 * Utility functions for the verifyStravaActivity Lit Action
 */

/**
 * Fetch challenge details from contract
 * @param {string} contractAddress - The contract address
 * @param {number} challengeId - The challenge ID
 * @returns {Object|null} Challenge details or null if not found
 */
async function fetchChallengeDetails(contractAddress, challengeId) {
  try {
    // In a real implementation, this would make a read-only contract call
    // For Phase 2, we'll simulate the response
    
    console.log(`Fetching challenge ${challengeId} from contract ${contractAddress}`);
    
    // Simulated contract response
    const challenge = {
      challengeId: challengeId,
      creator: '0x1234567890123456789012345678901234567890',
      description: 'Run 5km today',
      targetDistance: 5000, // 5km in meters
      stakeAmount: '1000000000000000000', // 1 ETH in wei
      startTime: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
      endTime: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
      totalStaked: '2000000000000000000', // 2 ETH total staked
      participantCount: 2,
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
 * @param {string} accessToken - Strava access token
 * @returns {Object|null} Activity data or null if not found
 */
async function fetchStravaActivity(accessToken) {
  try {
    console.log('Fetching Strava activity...');
    
    // For Phase 2, we'll use the mock server
    const response = await fetch('http://localhost:3001/athlete/activities', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Strava API error: ${response.status} ${response.statusText}`);
    }

    const activities = await response.json();
    
    if (!activities || activities.length === 0) {
      console.log('No activities found');
      return null;
    }

    // Return the most recent activity
    const latestActivity = activities[0];
    console.log(`Found activity: ${latestActivity.name} (${latestActivity.distance}m)`);
    
    return latestActivity;
  } catch (error) {
    console.error('Error fetching Strava activity:', error);
    return null;
  }
}

/**
 * Validate activity against challenge criteria
 * @param {Object} activity - Strava activity data
 * @param {Object} challenge - Challenge details
 * @returns {Object} Validation result
 */
function validateActivity(activity, challenge) {
  console.log('Validating activity against challenge criteria...');
  
  const result = {
    success: true,
    reason: '',
    isValidDistance: false,
    isValidType: false,
    isValidTimestamp: false,
    activityId: activity.id,
    distance: activity.distance,
    activityType: activity.type,
    timestamp: new Date(activity.start_date).getTime() / 1000,
    challengeId: challenge.challengeId,
    targetDistance: challenge.targetDistance
  };

  // Check activity type
  if (activity.type !== 'Run') {
    result.success = false;
    result.reason = `Invalid activity type: ${activity.type}. Expected: Run`;
    console.log(`❌ Type validation failed: ${activity.type} !== Run`);
    return result;
  }
  result.isValidType = true;
  console.log(`✅ Type validation passed: ${activity.type}`);

  // Check distance meets requirement
  if (activity.distance < challenge.targetDistance) {
    result.success = false;
    result.reason = `Distance too short: ${activity.distance}m. Required: ${challenge.targetDistance}m`;
    console.log(`❌ Distance validation failed: ${activity.distance}m < ${challenge.targetDistance}m`);
    return result;
  }
  result.isValidDistance = true;
  console.log(`✅ Distance validation passed: ${activity.distance}m >= ${challenge.targetDistance}m`);

  // Check timestamp within challenge window
  const activityTime = new Date(activity.start_date).getTime() / 1000;
  const startTime = challenge.startTime;
  const endTime = challenge.endTime;

  if (activityTime < startTime) {
    result.success = false;
    result.reason = `Activity too early: ${new Date(activity.start_date).toISOString()}. Challenge starts: ${new Date(startTime * 1000).toISOString()}`;
    console.log(`❌ Timestamp validation failed: activity too early`);
    return result;
  }

  if (activityTime > endTime) {
    result.success = false;
    result.reason = `Activity too late: ${new Date(activity.start_date).toISOString()}. Challenge ends: ${new Date(endTime * 1000).toISOString()}`;
    console.log(`❌ Timestamp validation failed: activity too late`);
    return result;
  }
  result.isValidTimestamp = true;
  console.log(`✅ Timestamp validation passed: activity within challenge window`);

  result.reason = 'Activity validation successful';
  console.log('🎉 All validations passed!');
  
  return result;
}

/**
 * Encode markTaskComplete transaction
 * @param {number} challengeId - The challenge ID
 * @param {string} userAddress - The user's address
 * @returns {string} Encoded transaction data
 */
function encodeMarkTaskComplete(challengeId, userAddress) {
  console.log(`Encoding markTaskComplete transaction for challenge ${challengeId}, user ${userAddress}`);
  
  // In a real implementation, this would use ethers.js or similar
  // to encode the function call with proper ABI
  
  const functionSignature = 'markTaskComplete(uint256,address)';
  const functionHash = ethers.utils.id(functionSignature).slice(0, 10); // First 4 bytes
  
  // Encode parameters
  const challengeIdPadded = ethers.utils.defaultAbiCoder.encode(['uint256'], [challengeId]);
  const userAddressPadded = ethers.utils.defaultAbiCoder.encode(['address'], [userAddress]);
  
  const encodedData = functionHash + challengeIdPadded.slice(2) + userAddressPadded.slice(2);
  
  console.log('Transaction encoded successfully');
  return encodedData;
}

/**
 * Format response for consistency
 * @param {boolean} success - Whether the operation was successful
 * @param {string} reason - Reason for success/failure
 * @param {Object} data - Additional data
 * @returns {Object} Formatted response
 */
function formatResponse(success, reason, data = {}) {
  return {
    success,
    reason,
    timestamp: new Date().toISOString(),
    ...data
  };
}

/**
 * Log activity details for debugging
 * @param {Object} activity - Strava activity
 */
function logActivityDetails(activity) {
  console.log('Activity Details:');
  console.log(`  ID: ${activity.id}`);
  console.log(`  Name: ${activity.name}`);
  console.log(`  Type: ${activity.type}`);
  console.log(`  Distance: ${activity.distance}m`);
  console.log(`  Start Time: ${activity.start_date}`);
  console.log(`  Moving Time: ${activity.moving_time}s`);
  console.log(`  Average Speed: ${activity.average_speed}m/s`);
}

/**
 * Log challenge details for debugging
 * @param {Object} challenge - Challenge details
 */
function logChallengeDetails(challenge) {
  console.log('Challenge Details:');
  console.log(`  ID: ${challenge.challengeId}`);
  console.log(`  Description: ${challenge.description}`);
  console.log(`  Target Distance: ${challenge.targetDistance}m`);
  console.log(`  Start Time: ${new Date(challenge.startTime * 1000).toISOString()}`);
  console.log(`  End Time: ${new Date(challenge.endTime * 1000).toISOString()}`);
  console.log(`  Stake Amount: ${challenge.stakeAmount} wei`);
  console.log(`  Participants: ${challenge.participantCount}`);
}

/**
 * Check if activity is recent enough
 * @param {Object} activity - Strava activity
 * @param {number} maxAgeHours - Maximum age in hours
 * @returns {boolean} Whether activity is recent enough
 */
function isActivityRecent(activity, maxAgeHours = 24) {
  const activityTime = new Date(activity.start_date).getTime();
  const now = Date.now();
  const maxAge = maxAgeHours * 60 * 60 * 1000; // Convert to milliseconds
  
  return (now - activityTime) <= maxAge;
}

/**
 * Calculate activity pace
 * @param {Object} activity - Strava activity
 * @returns {Object} Pace information
 */
function calculatePace(activity) {
  const distanceKm = activity.distance / 1000;
  const timeMinutes = activity.moving_time / 60;
  const pacePerKm = timeMinutes / distanceKm;
  
  return {
    distanceKm: distanceKm,
    timeMinutes: timeMinutes,
    pacePerKm: pacePerKm,
    pacePerKmFormatted: `${Math.floor(pacePerKm)}:${Math.floor((pacePerKm % 1) * 60).toString().padStart(2, '0')}`
  };
}

// Export functions for use in Lit Action
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    fetchChallengeDetails,
    fetchStravaActivity,
    validateActivity,
    encodeMarkTaskComplete,
    formatResponse,
    logActivityDetails,
    logChallengeDetails,
    isActivityRecent,
    calculatePace
  };
}
