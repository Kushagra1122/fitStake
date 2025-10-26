import axios from "axios";
import { ethers } from "ethers";

const ENVOI_GRAPHQL_URL = "http://10.175.109.154:8080/v1/graphql";

/**
 * Generic GraphQL Query Executor with better error handling
 */
async function queryGraphQL(query, variables = {}) {
  try {
    const response = await axios.post(ENVOI_GRAPHQL_URL, {
      query,
      variables,
    }, {
      timeout: 10000,
    });

    if (response.data.errors) {
      console.error("GraphQL Errors:", response.data.errors);
      throw new Error(response.data.errors[0]?.message || "GraphQL query failed");
    }

    return response.data.data;
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
 * Get comprehensive protocol metrics for system overview
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

    // Calculate metrics
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

    return {
      totalChallenges: challengesData.length,
      activeChallenges,
      totalVolumeStaked: totalVolumeStaked.toFixed(4),
      totalWinningsDistributed: totalWinningsDistributed.toFixed(4),
      successRate: (successRate * 100).toFixed(1),
      uniqueUsers,
      totalTasksCompleted: tasksData.length,
      avgStakeAmount: challengesData.length > 0 
        ? (totalVolumeStaked / challengesData.length).toFixed(4) 
        : '0.0000'
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
      avgStakeAmount: '0.0000'
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
  // New dashboard functions
  getProtocolMetrics,
  getActivityFeed,
  getLeaderboard,
  getHistoricalTrends,
  getChallengeAnalytics
};
