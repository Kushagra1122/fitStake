import axios from "axios";

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

export default {
  getAllChallenges,
  getUserJoined,
  getFinalizedChallenges,
  getTaskCompleted,
  getWinningsDistributed,
  getProfileData
};
