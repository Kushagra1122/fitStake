/**
 * Utility functions for FitStake app
 */

/**
 * Get emoji icon for activity type
 * @param {string} activityType - Type of activity (running, cycling, walking, swimming)
 * @returns {string} Emoji icon
 */
export const getActivityIcon = (activityType) => {
  const icons = {
    running: '🏃',
    cycling: '🚴',
    walking: '🚶',
    swimming: '🏊',
  };
  return icons[activityType] || '🏃';
};

/**
 * Get activity unit
 * @param {string} activityType - Type of activity
 * @returns {string} Unit (km, miles, etc.)
 */
export const getActivityUnit = (activityType) => {
  // For now, all activities use km
  return 'km';
};

/**
 * Format Ethereum address for display
 * @param {string} address - Full Ethereum address
 * @returns {string} Shortened address (0x1234...5678)
 */
export const formatAddress = (address) => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

/**
 * Get network name from chain ID
 * @param {number} chainId - Chain ID
 * @returns {string} Network name
 */
export const getChainName = (chainId) => {
  const chains = {
    1: 'Ethereum Mainnet',
    11155111: 'Sepolia Testnet',
    137: 'Polygon',
    10: 'Optimism',
  };
  return chains[chainId] || `Chain ID: ${chainId}`;
};

/**
 * Get network color from chain ID
 * @param {number} chainId - Chain ID
 * @returns {string} Hex color code
 */
export const getChainColor = (chainId) => {
  const colors = {
    1: '#627EEA',
    11155111: '#7B3FE4',
    137: '#8247E5',
    10: '#FF0420',
  };
  return colors[chainId] || '#6366F1';
};

/**
 * Calculate days left until deadline
 * @param {Date} deadline - Deadline date
 * @returns {number} Days remaining
 */
export const getDaysLeft = (deadline) => {
  const now = new Date();
  const diff = deadline - now;
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  return days > 0 ? days : 0;
};

/**
 * Get status color class based on days left
 * @param {number} daysLeft - Days remaining
 * @returns {string} Tailwind class names
 */
export const getStatusColor = (daysLeft) => {
  if (daysLeft <= 3) return 'bg-red-100 text-red-700';
  if (daysLeft <= 7) return 'bg-orange-100 text-orange-700';
  return 'bg-green-100 text-green-700';
};

/**
 * Format ETH amount for display
 * @param {string|number} amount - ETH amount
 * @param {number} decimals - Decimal places (default: 4)
 * @returns {string} Formatted amount
 */
export const formatEthAmount = (amount, decimals = 4) => {
  const num = parseFloat(amount);
  if (isNaN(num)) return '0';
  return num.toFixed(decimals);
};

/**
 * Validate Ethereum address
 * @param {string} address - Address to validate
 * @returns {boolean} True if valid
 */
export const isValidAddress = (address) => {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};

/**
 * Format duration label
 * @param {number} days - Number of days
 * @returns {string} Formatted label (e.g., "7 Days", "1 Month")
 */
export const formatDuration = (days) => {
  if (days === 7) return '1 Week';
  if (days === 14) return '2 Weeks';
  if (days === 30) return '1 Month';
  if (days === 60) return '2 Months';
  return `${days} Days`;
};

/**
 * Format distance with unit
 * @param {number} distance - Distance value
 * @param {string} unit - Unit (km, miles, etc.)
 * @returns {string} Formatted distance
 */
export const formatDistance = (distance, unit = 'km') => {
  return `${distance} ${unit}`;
};
