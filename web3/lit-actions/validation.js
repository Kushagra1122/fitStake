/**
 * Activity Validation Logic
 * 
 * Core validation functions for Strava activities against challenge criteria
 */

/**
 * Validate activity type
 * @param {Object} activity - Strava activity
 * @param {string} requiredType - Required activity type
 * @returns {Object} Validation result
 */
function validateActivityType(activity, requiredType = 'Run') {
  const isValid = activity.type === requiredType;
  
  return {
    isValid,
    actualType: activity.type,
    requiredType,
    reason: isValid ? 
      `Activity type valid: ${activity.type}` : 
      `Invalid activity type: ${activity.type}. Expected: ${requiredType}`
  };
}

/**
 * Validate activity distance
 * @param {Object} activity - Strava activity
 * @param {number} targetDistance - Target distance in meters
 * @param {Object} options - Validation options
 * @returns {Object} Validation result
 */
function validateActivityDistance(activity, targetDistance, options = {}) {
  const {
    minDistance = targetDistance,
    maxDistance = null,
    tolerance = 0 // Allow some tolerance in meters
  } = options;

  const distance = activity.distance;
  const minRequired = minDistance - tolerance;
  const maxAllowed = maxDistance ? maxDistance + tolerance : null;

  let isValid = distance >= minRequired;
  let reason = '';

  if (!isValid) {
    reason = `Distance too short: ${distance}m. Required: ${minRequired}m`;
  } else if (maxAllowed && distance > maxAllowed) {
    isValid = false;
    reason = `Distance too long: ${distance}m. Maximum allowed: ${maxAllowed}m`;
  } else {
    reason = `Distance valid: ${distance}m (target: ${targetDistance}m)`;
  }

  return {
    isValid,
    actualDistance: distance,
    targetDistance,
    minRequired,
    maxAllowed,
    reason
  };
}

/**
 * Validate activity timestamp
 * @param {Object} activity - Strava activity
 * @param {number} startTime - Challenge start time (Unix timestamp)
 * @param {number} endTime - Challenge end time (Unix timestamp)
 * @returns {Object} Validation result
 */
function validateActivityTimestamp(activity, startTime, endTime) {
  const activityTime = new Date(activity.start_date).getTime() / 1000;
  
  let isValid = true;
  let reason = '';
  let timeStatus = '';

  if (activityTime < startTime) {
    isValid = false;
    timeStatus = 'too_early';
    reason = `Activity too early: ${new Date(activity.start_date).toISOString()}. Challenge starts: ${new Date(startTime * 1000).toISOString()}`;
  } else if (activityTime > endTime) {
    isValid = false;
    timeStatus = 'too_late';
    reason = `Activity too late: ${new Date(activity.start_date).toISOString()}. Challenge ends: ${new Date(endTime * 1000).toISOString()}`;
  } else {
    timeStatus = 'valid';
    reason = `Activity timestamp valid: ${new Date(activity.start_date).toISOString()}`;
  }

  return {
    isValid,
    activityTime,
    startTime,
    endTime,
    timeStatus,
    reason
  };
}

/**
 * Validate activity completeness
 * @param {Object} activity - Strava activity
 * @returns {Object} Validation result
 */
function validateActivityCompleteness(activity) {
  const issues = [];
  
  // Check if activity has basic required fields
  if (!activity.id) issues.push('Missing activity ID');
  if (!activity.name) issues.push('Missing activity name');
  if (!activity.distance) issues.push('Missing distance');
  if (!activity.start_date) issues.push('Missing start date');
  if (!activity.type) issues.push('Missing activity type');
  
  // Check for suspicious values
  if (activity.distance <= 0) issues.push('Invalid distance (zero or negative)');
  if (activity.moving_time <= 0) issues.push('Invalid moving time (zero or negative)');
  if (activity.average_speed <= 0) issues.push('Invalid average speed (zero or negative)');
  
  // Check for unrealistic values
  if (activity.average_speed > 10) { // > 36 km/h is unrealistic for running
    issues.push('Unrealistic average speed (>36 km/h)');
  }
  
  if (activity.distance > 100000) { // > 100km is very long
    issues.push('Very long distance (>100km)');
  }

  const isValid = issues.length === 0;
  
  return {
    isValid,
    issues,
    reason: isValid ? 
      'Activity data complete and valid' : 
      `Activity validation issues: ${issues.join(', ')}`
  };
}

/**
 * Comprehensive activity validation
 * @param {Object} activity - Strava activity
 * @param {Object} challenge - Challenge details
 * @param {Object} options - Validation options
 * @returns {Object} Complete validation result
 */
function validateActivityComprehensive(activity, challenge, options = {}) {
  console.log('Starting comprehensive activity validation...');
  
  const validationResults = {
    success: true,
    reason: '',
    isValidDistance: false,
    isValidType: false,
    isValidTimestamp: false,
    isValidCompleteness: false,
    activityId: activity.id,
    distance: activity.distance,
    activityType: activity.type,
    timestamp: new Date(activity.start_date).getTime() / 1000,
    challengeId: challenge.challengeId,
    targetDistance: challenge.targetDistance,
    details: {}
  };

  // 1. Validate completeness
  const completenessResult = validateActivityCompleteness(activity);
  validationResults.isValidCompleteness = completenessResult.isValid;
  validationResults.details.completeness = completenessResult;
  
  if (!completenessResult.isValid) {
    validationResults.success = false;
    validationResults.reason = completenessResult.reason;
    return validationResults;
  }

  // 2. Validate activity type
  const typeResult = validateActivityType(activity, challenge.requiredActivityType || 'Run');
  validationResults.isValidType = typeResult.isValid;
  validationResults.details.type = typeResult;
  
  if (!typeResult.isValid) {
    validationResults.success = false;
    validationResults.reason = typeResult.reason;
    return validationResults;
  }

  // 3. Validate distance
  const distanceResult = validateActivityDistance(activity, challenge.targetDistance, options);
  validationResults.isValidDistance = distanceResult.isValid;
  validationResults.details.distance = distanceResult;
  
  if (!distanceResult.isValid) {
    validationResults.success = false;
    validationResults.reason = distanceResult.reason;
    return validationResults;
  }

  // 4. Validate timestamp
  const timestampResult = validateActivityTimestamp(activity, challenge.startTime, challenge.endTime);
  validationResults.isValidTimestamp = timestampResult.isValid;
  validationResults.details.timestamp = timestampResult;
  
  if (!timestampResult.isValid) {
    validationResults.success = false;
    validationResults.reason = timestampResult.reason;
    return validationResults;
  }

  // All validations passed
  validationResults.reason = 'Activity validation successful';
  console.log('✅ All validations passed!');
  
  return validationResults;
}

/**
 * Get validation summary
 * @param {Object} validationResult - Validation result
 * @returns {string} Human-readable summary
 */
function getValidationSummary(validationResult) {
  const checks = [
    { name: 'Completeness', passed: validationResult.isValidCompleteness },
    { name: 'Type', passed: validationResult.isValidType },
    { name: 'Distance', passed: validationResult.isValidDistance },
    { name: 'Timestamp', passed: validationResult.isValidTimestamp }
  ];

  const passedChecks = checks.filter(check => check.passed).length;
  const totalChecks = checks.length;

  return `${passedChecks}/${totalChecks} validation checks passed`;
}

/**
 * Check if activity qualifies for challenge
 * @param {Object} activity - Strava activity
 * @param {Object} challenge - Challenge details
 * @returns {boolean} Whether activity qualifies
 */
function activityQualifiesForChallenge(activity, challenge) {
  const validation = validateActivityComprehensive(activity, challenge);
  return validation.success;
}

// Export functions
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    validateActivityType,
    validateActivityDistance,
    validateActivityTimestamp,
    validateActivityCompleteness,
    validateActivityComprehensive,
    getValidationSummary,
    activityQualifiesForChallenge
  };
}
