import axios from "axios";
import { ethers } from "ethers";

const ENVOI_GRAPHQL_URL = "http://10.175.109.154:8080/v1/graphql";

// Cache for improved performance
const CACHE_DURATION = 30000; // 30 seconds
const dataCache = new Map();

/**
 * Generic GraphQL Query Executor with caching and better error handling
 */
async function queryGraphQL(query, variables = {}, useCache = true) {
  const cacheKey = `${query}_${JSON.stringify(variables)}`;
  
  // Check cache first
  if (useCache && dataCache.has(cacheKey)) {
    const cached = dataCache.get(cacheKey);
    if (Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }
  }

  try {
    const response = await axios.post(ENVOI_GRAPHQL_URL, {
      query,
      variables,
    }, {
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      }
    });

    if (response.data.errors) {
      console.error("GraphQL Errors:", response.data.errors);
      throw new Error(response.data.errors[0]?.message || "GraphQL query failed");
    }

    const data = response.data.data;
    
    // Cache the result
    if (useCache) {
      dataCache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });
    }

    return data;
  } catch (error) {
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND' || error.code === 'ECONNABORTED') {
      console.warn("GraphQL server not available at", ENVOI_GRAPHQL_URL);
      return {};
    }
    
    // Only log as warning for network errors, not as error
    console.warn("GraphQL Query Warning:", error.response?.data || error.message);
    return {};
  }
}

/**
 * Clear cache for fresh data
 */
export function clearCache() {
  dataCache.clear();
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  return {
    size: dataCache.size,
    entries: Array.from(dataCache.keys())
  };
}

/* ----------------------------- EVENT QUERIES ----------------------------- */

export async function getAllChallenges(limit = null) {
  const limitClause = limit ? `(limit: ${limit})` : "";
  const query = `
    query {
      Challengercc_ChallengeCreated ${limitClause} {
        id
        challengeId
        creator
        description
        stakeAmount
        startTime
        endTime
        targetDistance
      }
    }
  `;
  const data = await queryGraphQL(query);
  return data || {};
}

export async function getUserJoined({ challengeId = null, user = null, limit = null } = {}) {
  const filters = [];
  if (challengeId) filters.push(`challengeId: { _eq: "${challengeId}" }`);
  if (user) filters.push(`user: { _eq: "${user}" }`);
  const whereClause = filters.length ? `(where: { ${filters.join(", ")} }${limit ? `, limit: ${limit}` : ""})` : (limit ? `(limit: ${limit})` : "");

  const query = `
    query {
      Challengercc_UserJoined ${whereClause} {
        id
        challengeId
        user
        stakedAmount
      }
    }
  `;
  const data = await queryGraphQL(query);
  return data || {};
}

export async function getFinalizedChallenges(limit = null) {
  const limitClause = limit ? `(limit: ${limit})` : "";
  const query = `
    query {
      Challengercc_ChallengeFinalized ${limitClause} {
        id
        challengeId
        totalWinners
        totalLosers
      }
    }
  `;
  const data = await queryGraphQL(query);
  return data || {};
}

export async function getTaskCompleted({ challengeId = null, user = null, limit = null } = {}) {
  const filters = [];
  if (challengeId) filters.push(`challengeId: { _eq: "${challengeId}" }`);
  if (user) filters.push(`user: { _eq: "${user}" }`);
  const whereClause = filters.length ? `(where: { ${filters.join(", ")} }${limit ? `, limit: ${limit}` : ""})` : (limit ? `(limit: ${limit})` : "");

  const query = `
    query {
      Challengercc_TaskCompleted ${whereClause} {
        id
        challengeId
        user
        completionTimestamp
        distance
        duration
        stravaActivityId
      }
    }
  `;
  const data = await queryGraphQL(query);
  return data || {};
}

export async function getWinningsDistributed({ challengeId = null, user = null, limit = null } = {}) {
  const filters = [];
  if (challengeId) filters.push(`challengeId: { _eq: "${challengeId}" }`);
  if (user) filters.push(`winner: { _eq: "${user}" }`);
  const whereClause = filters.length ? `(where: { ${filters.join(", ")} }${limit ? `, limit: ${limit}` : ""})` : (limit ? `(limit: ${limit})` : "");

  const query = `
    query {
      Challengercc_WinningsDistributed ${whereClause} {
        id
        challengeId
        winner
        amount
      }
    }
  `;
  const data = await queryGraphQL(query);
  return data || {};
}

export async function getChallengeById(challengeId) {
  const query = `
    query {
      Challengercc_ChallengeCreated(where: { challengeId: { _eq: "${challengeId}" } }) {
        id
        challengeId
        creator
        description
        stakeAmount
        startTime
        endTime
        targetDistance
        activityType
        unit
        duration
        name
      }
    }
  `;
  const data = await queryGraphQL(query);
  return data?.Challengercc_ChallengeCreated?.[0] || null;
}

export async function getChallengeParticipants(challengeId) {
  const query = `
    query {
      Challengercc_UserJoined(where: { challengeId: { _eq: "${challengeId}" } }) {
        id
        challengeId
        user
        stakedAmount
      }
    }
  `;
  const data = await queryGraphQL(query);
  return data?.Challengercc_UserJoined || [];
}

export async function getChallengeTaskCompletions(challengeId) {
  const query = `
    query {
      Challengercc_TaskCompleted(where: { challengeId: { _eq: "${challengeId}" } }) {
        id
        challengeId
        user
        completionTimestamp
        distance
        duration
        stravaActivityId
      }
    }
  `;
  const data = await queryGraphQL(query);
  return data?.Challengercc_TaskCompleted || [];
}

export async function getChallengeFinalization(challengeId) {
  const query = `
    query {
      Challengercc_ChallengeFinalized(where: { challengeId: { _eq: "${challengeId}" } }) {
        id
        challengeId
        totalWinners
        totalLosers
      }
    }
  `;
  const data = await queryGraphQL(query);
  return data?.Challengercc_ChallengeFinalized?.[0] || null;
}

/**
 * Get comprehensive profile data for a user
 */
export async function getProfileData(userAddress, limit = 5) {
  try {
    const [challenges, joined, tasks, winnings] = await Promise.allSettled([
      getAllChallenges(limit),
      getUserJoined({ user: userAddress, limit }),
      getTaskCompleted({ user: userAddress, limit }),
      getWinningsDistributed({ user: userAddress, limit })
    ]);

    return {
      challenges: challenges.status === 'fulfilled' ? (challenges.value?.Challengercc_ChallengeCreated || []) : [],
      joined: joined.status === 'fulfilled' ? (joined.value?.Challengercc_UserJoined || []) : [],
      tasks: tasks.status === 'fulfilled' ? (tasks.value?.Challengercc_TaskCompleted || []) : [],
      winnings: winnings.status === 'fulfilled' ? (winnings.value?.Challengercc_WinningsDistributed || []) : []
    };
    
  } catch (error) {
    console.error('Error fetching profile data:', error);
    return { challenges: [], joined: [], tasks: [], winnings: [] };
  }
}

/* ----------------------------- DASHBOARD ANALYTICS QUERIES ----------------------------- */

/**
 * Get comprehensive protocol metrics for system overview with real-time insights
 */
export async function getProtocolMetrics() {
  try {
    const [challenges, finalized, tasks, winnings, joined] = await Promise.allSettled([
      getAllChallenges(),
      getFinalizedChallenges(),
      getTaskCompleted(),
      getWinningsDistributed(),
      getUserJoined()
    ]);

    const challengesData = challenges.status === 'fulfilled' ? challenges.value?.Challengercc_ChallengeCreated || [] : [];
    const finalizedData = finalized.status === 'fulfilled' ? finalized.value?.Challengercc_ChallengeFinalized || [] : [];
    const tasksData = tasks.status === 'fulfilled' ? tasks.value?.Challengercc_TaskCompleted || [] : [];
    const winningsData = winnings.status === 'fulfilled' ? winnings.value?.Challengercc_WinningsDistributed || [] : [];
    const joinedData = joined.status === 'fulfilled' ? joined.value?.Challengercc_UserJoined || [] : [];

    // Calculate comprehensive metrics
    const totalVolumeStaked = challengesData.reduce((sum, c) => {
      const participants = joinedData.filter(j => j.challengeId?.toString() === c.challengeId?.toString());
      return sum + participants.reduce((pSum, p) => pSum + parseFloat(ethers.formatEther(p.stakedAmount || '0')), 0);
    }, 0);

    const totalWinningsDistributed = winningsData.reduce((sum, w) => {
      return sum + parseFloat(ethers.formatEther(w.amount || '0'));
    }, 0);

    const activeChallenges = challengesData.filter(c => {
      const endTime = parseInt(c.endTime);
      return endTime > Date.now() / 1000;
    }).length;

    const successRate = finalizedData.length > 0 
      ? finalizedData.reduce((sum, f) => sum + parseInt(f.totalWinners), 0) / 
        finalizedData.reduce((sum, f) => sum + parseInt(f.totalWinners) + parseInt(f.totalLosers), 0)
      : 0;

    const uniqueUsers = new Set([
      ...challengesData.map(c => c.creator),
      ...joinedData.map(j => j.user),
      ...tasksData.map(t => t.user),
      ...winningsData.map(w => w.winner)
    ]).size;

    // Calculate additional insights
    const avgStakeAmount = challengesData.length > 0 
      ? (totalVolumeStaked / challengesData.length) 
      : 0;

    const avgWinningsPerWinner = winningsData.length > 0
      ? (totalWinningsDistributed / winningsData.length)
      : 0;

    const totalDistanceCompleted = tasksData.reduce((sum, task) => {
      return sum + (parseInt(task.distance) || 0);
    }, 0);

    const totalDurationCompleted = tasksData.reduce((sum, task) => {
      return sum + (parseInt(task.duration) || 0);
    }, 0);

    // Calculate trends (last 7 days vs previous 7 days)
    const now = Date.now() / 1000;
    const sevenDaysAgo = now - (7 * 24 * 60 * 60);
    const fourteenDaysAgo = now - (14 * 24 * 60 * 60);

    const recentChallenges = challengesData.filter(c => parseInt(c.startTime) >= sevenDaysAgo).length;
    const previousChallenges = challengesData.filter(c => 
      parseInt(c.startTime) >= fourteenDaysAgo && parseInt(c.startTime) < sevenDaysAgo
    ).length;

    const recentTasks = tasksData.filter(t => parseInt(t.completionTimestamp) >= sevenDaysAgo).length;
    const previousTasks = tasksData.filter(t => 
      parseInt(t.completionTimestamp) >= fourteenDaysAgo && parseInt(t.completionTimestamp) < sevenDaysAgo
    ).length;

    const challengeGrowthRate = previousChallenges > 0 
      ? ((recentChallenges - previousChallenges) / previousChallenges) * 100 
      : recentChallenges > 0 ? 100 : 0;

    const taskGrowthRate = previousTasks > 0 
      ? ((recentTasks - previousTasks) / previousTasks) * 100 
      : recentTasks > 0 ? 100 : 0;

    // Calculate protocol health score
    const healthScore = Math.min(100, Math.max(0, 
      (activeChallenges * 10) + 
      (uniqueUsers * 5) + 
      (successRate * 30) + 
      (totalVolumeStaked * 2)
    ));

    return {
      // Core metrics
      totalChallenges: challengesData.length,
      activeChallenges,
      totalVolumeStaked: totalVolumeStaked.toFixed(4),
      totalWinningsDistributed: totalWinningsDistributed.toFixed(4),
      successRate: (successRate * 100).toFixed(1),
      uniqueUsers,
      totalTasksCompleted: tasksData.length,
      avgStakeAmount: avgStakeAmount.toFixed(4),
      
      // Enhanced metrics
      avgWinningsPerWinner: avgWinningsPerWinner.toFixed(4),
      totalDistanceCompleted: (totalDistanceCompleted / 1000).toFixed(2), // in km
      totalDurationCompleted: Math.floor(totalDurationCompleted / 3600), // in hours
      
      // Growth metrics
      challengeGrowthRate: challengeGrowthRate.toFixed(1),
      taskGrowthRate: taskGrowthRate.toFixed(1),
      recentChallenges,
      recentTasks,
      
      // Health indicators
      healthScore: healthScore.toFixed(0),
      healthStatus: healthScore >= 80 ? 'Excellent' : 
                   healthScore >= 60 ? 'Good' : 
                   healthScore >= 40 ? 'Fair' : 'Needs Attention',
      
      // Timestamps for real-time updates
      lastUpdated: Date.now(),
      dataFreshness: 'live'
    };
  } catch (error) {
    console.error('Error fetching protocol metrics:', error);
    return {
      totalChallenges: 0,
      activeChallenges: 0,
      totalVolumeStaked: '0.0000',
      totalWinningsDistributed: '0.0000',
      successRate: '0.0',
      uniqueUsers: 0,
      totalTasksCompleted: 0,
      avgStakeAmount: '0.0000',
      avgWinningsPerWinner: '0.0000',
      totalDistanceCompleted: '0.00',
      totalDurationCompleted: 0,
      challengeGrowthRate: '0.0',
      taskGrowthRate: '0.0',
      recentChallenges: 0,
      recentTasks: 0,
      healthScore: '0',
      healthStatus: 'Needs Attention',
      lastUpdated: Date.now(),
      dataFreshness: 'error'
    };
  }
}

/**
 * Get live activity feed across all challenges
 */
export async function getActivityFeed(limit = 20) {
  try {
    const [challenges, tasks, winnings, joined] = await Promise.allSettled([
      getAllChallenges(limit),
      getTaskCompleted({ limit }),
      getWinningsDistributed({ limit }),
      getUserJoined({ limit })
    ]);

    const challengesData = challenges.status === 'fulfilled' ? challenges.value?.Challengercc_ChallengeCreated || [] : [];
    const tasksData = tasks.status === 'fulfilled' ? tasks.value?.Challengercc_TaskCompleted || [] : [];
    const winningsData = winnings.status === 'fulfilled' ? winnings.value?.Challengercc_WinningsDistributed || [] : [];
    const joinedData = joined.status === 'fulfilled' ? joined.value?.Challengercc_UserJoined || [] : [];

    // Create activity feed items
    const activities = [];

    // Add recent challenges
    challengesData.forEach(challenge => {
      activities.push({
        id: `challenge_${challenge.id}`,
        type: 'challenge_created',
        timestamp: parseInt(challenge.startTime),
        data: {
          challengeId: challenge.challengeId,
          creator: challenge.creator,
          description: challenge.description,
          stakeAmount: challenge.stakeAmount,
          targetDistance: challenge.targetDistance
        }
      });
    });

    // Add recent task completions
    tasksData.forEach(task => {
      activities.push({
        id: `task_${task.id}`,
        type: 'task_completed',
        timestamp: parseInt(task.completionTimestamp),
        data: {
          challengeId: task.challengeId,
          user: task.user,
          distance: task.distance,
          duration: task.duration,
          stravaActivityId: task.stravaActivityId
        }
      });
    });

    // Add recent winnings
    winningsData.forEach(winning => {
      activities.push({
        id: `winning_${winning.id}`,
        type: 'winnings_distributed',
        timestamp: Date.now() / 1000, // Approximate timestamp
        data: {
          challengeId: winning.challengeId,
          winner: winning.winner,
          amount: winning.amount
        }
      });
    });

    // Add recent joins
    joinedData.forEach(join => {
      activities.push({
        id: `join_${join.id}`,
        type: 'user_joined',
        timestamp: Date.now() / 1000, // Approximate timestamp
        data: {
          challengeId: join.challengeId,
          user: join.user,
          stakedAmount: join.stakedAmount
        }
      });
    });

    // Sort by timestamp (most recent first) and limit
    return activities
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);

  } catch (error) {
    console.error('Error fetching activity feed:', error);
    return [];
  }
}

/**
 * Get leaderboard data for top performers
 */
export async function getLeaderboard() {
  try {
    const [winnings, tasks, challenges, joined] = await Promise.allSettled([
      getWinningsDistributed(),
      getTaskCompleted(),
      getAllChallenges(),
      getUserJoined()
    ]);

    const winningsData = winnings.status === 'fulfilled' ? winnings.value?.Challengercc_WinningsDistributed || [] : [];
    const tasksData = tasks.status === 'fulfilled' ? tasks.value?.Challengercc_TaskCompleted || [] : [];
    const challengesData = challenges.status === 'fulfilled' ? challenges.value?.Challengercc_ChallengeCreated || [] : [];
    const joinedData = joined.status === 'fulfilled' ? joined.value?.Challengercc_UserJoined || [] : [];

    // Calculate user stats
    const userStats = {};

    // Process winnings
    winningsData.forEach(winning => {
      const user = winning.winner.toLowerCase();
      if (!userStats[user]) {
        userStats[user] = {
          address: winning.winner,
          totalWinnings: 0,
          tasksCompleted: 0,
          challengesCreated: 0,
          challengesJoined: 0,
          successRate: 0
        };
      }
      userStats[user].totalWinnings += parseFloat(ethers.formatEther(winning.amount || '0'));
    });

    // Process tasks
    tasksData.forEach(task => {
      const user = task.user.toLowerCase();
      if (!userStats[user]) {
        userStats[user] = {
          address: task.user,
          totalWinnings: 0,
          tasksCompleted: 0,
          challengesCreated: 0,
          challengesJoined: 0,
          successRate: 0
        };
      }
      userStats[user].tasksCompleted++;
    });

    // Process challenges created
    challengesData.forEach(challenge => {
      const user = challenge.creator.toLowerCase();
      if (!userStats[user]) {
        userStats[user] = {
          address: challenge.creator,
          totalWinnings: 0,
          tasksCompleted: 0,
          challengesCreated: 0,
          challengesJoined: 0,
          successRate: 0
        };
      }
      userStats[user].challengesCreated++;
    });

    // Process challenges joined
    joinedData.forEach(join => {
      const user = join.user.toLowerCase();
      if (!userStats[user]) {
        userStats[user] = {
          address: join.user,
          totalWinnings: 0,
          tasksCompleted: 0,
          challengesCreated: 0,
          challengesJoined: 0,
          successRate: 0
        };
      }
      userStats[user].challengesJoined++;
    });

    // Calculate success rates
    Object.values(userStats).forEach(user => {
      if (user.challengesJoined > 0) {
        user.successRate = (user.tasksCompleted / user.challengesJoined) * 100;
      }
    });

    // Create leaderboards
    const users = Object.values(userStats);
    
    return {
      topWinners: users
        .sort((a, b) => b.totalWinnings - a.totalWinnings)
        .slice(0, 10)
        .map((user, index) => ({ ...user, rank: index + 1 })),
      
      mostActive: users
        .sort((a, b) => b.tasksCompleted - a.tasksCompleted)
        .slice(0, 10)
        .map((user, index) => ({ ...user, rank: index + 1 })),
      
      topCreators: users
        .sort((a, b) => b.challengesCreated - a.challengesCreated)
        .slice(0, 10)
        .map((user, index) => ({ ...user, rank: index + 1 })),
      
      highestSuccessRate: users
        .filter(user => user.challengesJoined >= 3) // Minimum 3 challenges for meaningful rate
        .sort((a, b) => b.successRate - a.successRate)
        .slice(0, 10)
        .map((user, index) => ({ ...user, rank: index + 1 }))
    };

  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return {
      topWinners: [],
      mostActive: [],
      topCreators: [],
      highestSuccessRate: []
    };
  }
}

/**
 * Get historical trends data for charts
 */
export async function getHistoricalTrends(days = 30) {
  try {
    const [challenges, tasks, winnings] = await Promise.allSettled([
      getAllChallenges(),
      getTaskCompleted(),
      getWinningsDistributed()
    ]);

    const challengesData = challenges.status === 'fulfilled' ? challenges.value?.Challengercc_ChallengeCreated || [] : [];
    const tasksData = tasks.status === 'fulfilled' ? tasks.value?.Challengercc_TaskCompleted || [] : [];
    const winningsData = winnings.status === 'fulfilled' ? winnings.value?.Challengercc_WinningsDistributed || [] : [];

    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - (days * 24 * 60 * 60 * 1000));
    
    // Create daily buckets
    const dailyData = {};
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateKey = d.toISOString().split('T')[0];
      dailyData[dateKey] = {
        date: dateKey,
        challengesCreated: 0,
        tasksCompleted: 0,
        winningsDistributed: 0,
        volumeStaked: 0
      };
    }

    // Process challenges
    challengesData.forEach(challenge => {
      const challengeDate = new Date(parseInt(challenge.startTime) * 1000);
      const dateKey = challengeDate.toISOString().split('T')[0];
      if (dailyData[dateKey]) {
        dailyData[dateKey].challengesCreated++;
      }
    });

    // Process tasks
    tasksData.forEach(task => {
      const taskDate = new Date(parseInt(task.completionTimestamp) * 1000);
      const dateKey = taskDate.toISOString().split('T')[0];
      if (dailyData[dateKey]) {
        dailyData[dateKey].tasksCompleted++;
      }
    });

    // Process winnings
    winningsData.forEach(winning => {
      // Approximate timestamp for winnings
      const winningDate = new Date();
      const dateKey = winningDate.toISOString().split('T')[0];
      if (dailyData[dateKey]) {
        dailyData[dateKey].winningsDistributed += parseFloat(ethers.formatEther(winning.amount || '0'));
      }
    });

    return Object.values(dailyData).sort((a, b) => new Date(a.date) - new Date(b.date));

  } catch (error) {
    console.error('Error fetching historical trends:', error);
    return [];
  }
}

/**
 * Get detailed challenge analytics with comparisons
 */
export async function getChallengeAnalytics() {
  try {
    const [challenges, finalized, tasks, joined] = await Promise.allSettled([
      getAllChallenges(),
      getFinalizedChallenges(),
      getTaskCompleted(),
      getUserJoined()
    ]);

    const challengesData = challenges.status === 'fulfilled' ? challenges.value?.Challengercc_ChallengeCreated || [] : [];
    const finalizedData = finalized.status === 'fulfilled' ? finalized.value?.Challengercc_ChallengeFinalized || [] : [];
    const tasksData = tasks.status === 'fulfilled' ? tasks.value?.Challengercc_TaskCompleted || [] : [];
    const joinedData = joined.status === 'fulfilled' ? joined.value?.Challengercc_UserJoined || [] : [];

    // Analyze each challenge
    const challengeAnalytics = challengesData.map(challenge => {
      const challengeId = challenge.challengeId.toString();
      
      // Get participants for this challenge
      const participants = joinedData.filter(j => j.challengeId?.toString() === challengeId);
      
      // Get tasks completed for this challenge
      const completedTasks = tasksData.filter(t => t.challengeId?.toString() === challengeId);
      
      // Get finalization data
      const finalization = finalizedData.find(f => f.challengeId?.toString() === challengeId);
      
      // Calculate metrics
      const participantCount = participants.length;
      const completionCount = completedTasks.length;
      const completionRate = participantCount > 0 ? (completionCount / participantCount) * 100 : 0;
      
      const totalStaked = participants.reduce((sum, p) => sum + parseFloat(ethers.formatEther(p.stakedAmount || '0')), 0);
      const avgStake = participantCount > 0 ? totalStaked / participantCount : 0;
      
      const isActive = parseInt(challenge.endTime) > Date.now() / 1000;
      const isFinalized = !!finalization;
      
      return {
        challengeId,
        description: challenge.description,
        creator: challenge.creator,
        targetDistance: parseInt(challenge.targetDistance),
        stakeAmount: parseFloat(ethers.formatEther(challenge.stakeAmount)),
        startTime: parseInt(challenge.startTime),
        endTime: parseInt(challenge.endTime),
        participantCount,
        completionCount,
        completionRate: completionRate.toFixed(1),
        totalStaked: totalStaked.toFixed(4),
        avgStake: avgStake.toFixed(4),
        isActive,
        isFinalized,
        difficulty: completionRate < 30 ? 'Hard' : completionRate < 70 ? 'Medium' : 'Easy'
      };
    });

    // Calculate overall statistics
    const totalChallenges = challengesData.length;
    const activeChallenges = challengeAnalytics.filter(c => c.isActive).length;
    const avgCompletionRate = challengeAnalytics.length > 0 
      ? challengeAnalytics.reduce((sum, c) => sum + parseFloat(c.completionRate), 0) / challengeAnalytics.length
      : 0;

    const avgStakeAmount = challengeAnalytics.length > 0
      ? challengeAnalytics.reduce((sum, c) => sum + parseFloat(c.avgStake), 0) / challengeAnalytics.length
      : 0;

    const difficultyDistribution = challengeAnalytics.reduce((dist, c) => {
      dist[c.difficulty] = (dist[c.difficulty] || 0) + 1;
      return dist;
    }, {});

    return {
      challenges: challengeAnalytics,
      summary: {
        totalChallenges,
        activeChallenges,
        avgCompletionRate: avgCompletionRate.toFixed(1),
        avgStakeAmount: avgStakeAmount.toFixed(4),
        difficultyDistribution
      }
    };

  } catch (error) {
    console.error('Error fetching challenge analytics:', error);
    return {
      challenges: [],
      summary: {
        totalChallenges: 0,
        activeChallenges: 0,
        avgCompletionRate: '0.0',
        avgStakeAmount: '0.0000',
        difficultyDistribution: {}
      }
    };
  }
}

/**
 * Get comprehensive wallet analytics for a specific user
 */
export async function getWalletAnalytics(userAddress) {
  try {
    const [profileData, allChallenges, allTasks, allWinnings] = await Promise.allSettled([
      getProfileData(userAddress, 50),
      getAllChallenges(50),
      getTaskCompleted({ user: userAddress, limit: 50 }),
      getWinningsDistributed({ user: userAddress, limit: 50 })
    ]);

    const profile = profileData.status === 'fulfilled' ? profileData.value : { challenges: [], joined: [], tasks: [], winnings: [] };
    const challenges = allChallenges.status === 'fulfilled' ? allChallenges.value?.Challengercc_ChallengeCreated || [] : [];
    const tasks = allTasks.status === 'fulfilled' ? allTasks.value?.Challengercc_TaskCompleted || [] : [];
    const winnings = allWinnings.status === 'fulfilled' ? allWinnings.value?.Challengercc_WinningsDistributed || [] : [];

    // Calculate wallet performance metrics
    const totalStaked = profile.joined.reduce((sum, join) => {
      return sum + parseFloat(ethers.formatEther(join.stakedAmount || '0'));
    }, 0);

    const totalWon = winnings.reduce((sum, win) => {
      return sum + parseFloat(ethers.formatEther(win.amount || '0'));
    }, 0);

    const totalDistance = tasks.reduce((sum, task) => {
      return sum + (parseInt(task.distance) || 0);
    }, 0);

    const totalDuration = tasks.reduce((sum, task) => {
      return sum + (parseInt(task.duration) || 0);
    }, 0);

    const roi = totalStaked > 0 ? ((totalWon - totalStaked) / totalStaked) * 100 : 0;
    const successRate = profile.joined.length > 0 ? (tasks.length / profile.joined.length) * 100 : 0;

    // Calculate activity patterns
    const taskTimestamps = tasks.map(t => parseInt(t.completionTimestamp));
    const avgTimeBetweenTasks = taskTimestamps.length > 1 
      ? taskTimestamps.sort((a, b) => a - b).reduce((sum, time, i) => {
          if (i === 0) return 0;
          return sum + (time - taskTimestamps[i - 1]);
        }, 0) / (taskTimestamps.length - 1)
      : 0;

    // Calculate challenge preferences
    const challengeTypes = {};
    challenges.forEach(challenge => {
      const type = challenge.description.toLowerCase().includes('run') ? 'Running' :
                   challenge.description.toLowerCase().includes('walk') ? 'Walking' :
                   challenge.description.toLowerCase().includes('cycle') ? 'Cycling' : 'Other';
      challengeTypes[type] = (challengeTypes[type] || 0) + 1;
    });

    return {
      // Financial metrics
      totalStaked: totalStaked.toFixed(4),
      totalWon: totalWon.toFixed(4),
      netProfit: (totalWon - totalStaked).toFixed(4),
      roi: roi.toFixed(2),
      
      // Performance metrics
      successRate: successRate.toFixed(1),
      totalDistance: (totalDistance / 1000).toFixed(2), // km
      totalDuration: Math.floor(totalDuration / 3600), // hours
      avgDistancePerTask: tasks.length > 0 ? (totalDistance / tasks.length / 1000).toFixed(2) : '0.00',
      
      // Activity patterns
      totalTasks: tasks.length,
      totalChallengesJoined: profile.joined.length,
      totalChallengesCreated: profile.challenges.length,
      avgTimeBetweenTasks: Math.floor(avgTimeBetweenTasks / 3600), // hours
      
      // Preferences
      challengeTypes,
      preferredActivityType: Object.keys(challengeTypes).reduce((a, b) => 
        challengeTypes[a] > challengeTypes[b] ? a : b, 'Running'
      ),
      
      // Rankings (would need to compare with all users)
      estimatedRank: 'Top 25%', // Placeholder
      
      lastUpdated: Date.now()
    };
  } catch (error) {
    console.error('Error fetching wallet analytics:', error);
    return {
      totalStaked: '0.0000',
      totalWon: '0.0000',
      netProfit: '0.0000',
      roi: '0.00',
      successRate: '0.0',
      totalDistance: '0.00',
      totalDuration: 0,
      avgDistancePerTask: '0.00',
      totalTasks: 0,
      totalChallengesJoined: 0,
      totalChallengesCreated: 0,
      avgTimeBetweenTasks: 0,
      challengeTypes: {},
      preferredActivityType: 'Running',
      estimatedRank: 'N/A',
      lastUpdated: Date.now()
    };
  }
}

/**
 * Get ecosystem insights and protocol health indicators
 */
export async function getEcosystemInsights() {
  try {
    const [metrics, trends, leaderboard] = await Promise.allSettled([
      getProtocolMetrics(),
      getHistoricalTrends(30),
      getLeaderboard()
    ]);

    const protocolMetrics = metrics.status === 'fulfilled' ? metrics.value : {};
    const historicalData = trends.status === 'fulfilled' ? trends.value : [];
    const leaderboardData = leaderboard.status === 'fulfilled' ? leaderboard.value : {};

    // Calculate ecosystem health indicators
    const totalParticipants = protocolMetrics.uniqueUsers || 0;

    const avgChallengeDuration = historicalData.length > 0 
      ? historicalData.reduce((sum, day) => sum + (day.challengesCreated || 0), 0) / historicalData.length
      : 0;

    const ecosystemGrowthRate = historicalData.length >= 7 
      ? (() => {
          const recentWeek = historicalData.slice(-7).reduce((sum, day) => sum + (day.challengesCreated || 0), 0);
          const previousWeek = historicalData.slice(-14, -7).reduce((sum, day) => sum + (day.challengesCreated || 0), 0);
          return previousWeek > 0 ? ((recentWeek - previousWeek) / previousWeek) * 100 : recentWeek > 0 ? 100 : 0;
        })()
      : 0;

    // Calculate network effects
    const networkEffectScore = Math.min(100, 
      (totalParticipants * 2) + 
      (protocolMetrics.activeChallenges * 5) + 
      (parseFloat(protocolMetrics.successRate) * 0.5)
    );

    // Generate insights
    const insights = [];
    
    if (ecosystemGrowthRate > 20) {
      insights.push({
        type: 'positive',
        title: 'Rapid Growth',
        message: `Ecosystem growing at ${ecosystemGrowthRate.toFixed(1)}% week-over-week`,
        icon: '🚀'
      });
    }
    
    if (parseFloat(protocolMetrics.successRate) > 70) {
      insights.push({
        type: 'positive',
        title: 'High Success Rate',
        message: `${protocolMetrics.successRate}% completion rate indicates strong engagement`,
        icon: '📈'
      });
    }
    
    if (protocolMetrics.activeChallenges < 5) {
      insights.push({
        type: 'warning',
        title: 'Low Activity',
        message: 'Only a few active challenges - consider creating more',
        icon: '⚠️'
      });
    }

    return {
      // Core ecosystem metrics
      totalParticipants,
      networkEffectScore: networkEffectScore.toFixed(0),
      ecosystemGrowthRate: ecosystemGrowthRate.toFixed(1),
      avgChallengeDuration: avgChallengeDuration.toFixed(1),
      
      // Health indicators
      ecosystemHealth: networkEffectScore >= 80 ? 'Excellent' :
                      networkEffectScore >= 60 ? 'Good' :
                      networkEffectScore >= 40 ? 'Fair' : 'Needs Attention',
      
      // Insights and recommendations
      insights,
      
      // Market indicators
      totalVolumeLocked: protocolMetrics.totalVolumeStaked,
      averageStakeSize: protocolMetrics.avgStakeAmount,
      marketCap: (parseFloat(protocolMetrics.totalVolumeStaked) * 1000).toFixed(0), // Estimated
      
      // Social indicators
      topPerformers: leaderboardData.topWinners?.slice(0, 5) || [],
      mostActiveUsers: leaderboardData.mostActive?.slice(0, 5) || [],
      
      lastUpdated: Date.now()
    };
  } catch (error) {
    console.error('Error fetching ecosystem insights:', error);
    return {
      totalParticipants: 0,
      networkEffectScore: '0',
      ecosystemGrowthRate: '0.0',
      avgChallengeDuration: '0.0',
      ecosystemHealth: 'Needs Attention',
      insights: [],
      totalVolumeLocked: '0.0000',
      averageStakeSize: '0.0000',
      marketCap: '0',
      topPerformers: [],
      mostActiveUsers: [],
      lastUpdated: Date.now()
    };
  }
}

/**
 * Get real-time data for live dashboard updates
 */
export async function getLiveDashboardData() {
  try {
    const [metrics, activityFeed, ecosystemInsights] = await Promise.allSettled([
      getProtocolMetrics(),
      getActivityFeed(10),
      getEcosystemInsights()
    ]);

    return {
      protocolMetrics: metrics.status === 'fulfilled' ? metrics.value : {},
      activityFeed: activityFeed.status === 'fulfilled' ? activityFeed.value : [],
      ecosystemInsights: ecosystemInsights.status === 'fulfilled' ? ecosystemInsights.value : {},
      lastUpdated: Date.now(),
      isLive: true
    };
  } catch (error) {
    console.error('Error fetching live dashboard data:', error);
    return {
      protocolMetrics: {},
      activityFeed: [],
      ecosystemInsights: {},
      lastUpdated: Date.now(),
      isLive: false
    };
  }
}

export default {
  getAllChallenges,
  getUserJoined,
  getFinalizedChallenges,
  getTaskCompleted,
  getWinningsDistributed,
  getProfileData,
  getChallengeById,
  getChallengeParticipants,
  getChallengeTaskCompletions,
  getChallengeFinalization,
  // Enhanced dashboard functions
  getProtocolMetrics,
  getActivityFeed,
  getLeaderboard,
  getHistoricalTrends,
  getChallengeAnalytics,
  // New advanced functions
  getWalletAnalytics,
  getEcosystemInsights,
  getLiveDashboardData,
  clearCache,
  getCacheStats
};
