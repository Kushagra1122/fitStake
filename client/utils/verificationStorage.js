import AsyncStorage from '@react-native-async-storage/async-storage';

const VERIFICATION_STORAGE_KEY = 'challenge_verifications';

/**
 * Get all stored verifications
 */
export const getStoredVerifications = async () => {
  try {
    const stored = await AsyncStorage.getItem(VERIFICATION_STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.error('Error getting stored verifications:', error);
    return {};
  }
};

/**
 * Save a verification for a challenge and date
 */
export const saveVerification = async (challengeId, userAddress, date, transactionHash) => {
  try {
    const verifications = await getStoredVerifications();
    // Use lowercase for case-insensitive lookup
    const key = `${challengeId}_${userAddress.toLowerCase()}_${date}`;
    
    verifications[key] = {
      challengeId,
      userAddress: userAddress.toLowerCase(), // Store in lowercase
      date,
      transactionHash,
      timestamp: new Date().toISOString(),
    };
    
    await AsyncStorage.setItem(VERIFICATION_STORAGE_KEY, JSON.stringify(verifications));
    console.log('✅ Verification saved:', key);
    return true;
  } catch (error) {
    console.error('Error saving verification:', error);
    return false;
  }
};

/**
 * Check if a verification exists for a challenge and date
 */
export const isVerified = async (challengeId, userAddress, date) => {
  try {
    const verifications = await getStoredVerifications();
    // Use lowercase for case-insensitive lookup
    const key = `${challengeId}_${userAddress.toLowerCase()}_${date}`;
    const verified = !!verifications[key];
    console.log('🔍 Checking verification:', { key, verified, allKeys: Object.keys(verifications) });
    return verified;
  } catch (error) {
    console.error('Error checking verification:', error);
    return false;
  }
};

/**
 * Get verification details for a challenge and date
 */
export const getVerification = async (challengeId, userAddress, date) => {
  try {
    const verifications = await getStoredVerifications();
    // Use lowercase for case-insensitive lookup
    const key = `${challengeId}_${userAddress.toLowerCase()}_${date}`;
    return verifications[key] || null;
  } catch (error) {
    console.error('Error getting verification:', error);
    return null;
  }
};

/**
 * Clear all verifications
 */
export const clearVerifications = async () => {
  try {
    await AsyncStorage.removeItem(VERIFICATION_STORAGE_KEY);
    console.log('✅ All verifications cleared');
    return true;
  } catch (error) {
    console.error('Error clearing verifications:', error);
    return false;
  }
};

/**
 * Format date to YYYY-MM-DD
 */
export const formatDate = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
