// src/api/envioService.js
import axios from "axios";

// Replace with your actual Envio GraphQL endpoint
const ENVOI_GRAPHQL_URL = "http://localhost:8080/v1/graphql"; 

/**
 * Generic GraphQL Query Executor
 */
async function queryGraphQL(query, variables = {}) {
  try {
    const response = await axios.post(ENVOI_GRAPHQL_URL, {
      query,
      variables,
    });
    return response.data.data;
  } catch (error) {
    console.error("GraphQL Query Error:", error.response?.data || error.message);
    throw error;
  }
}

/* ----------------------------- EVENT QUERIES ----------------------------- */

/**
 * Get all challenges created
 */
export async function getAllChallenges() {
  const query = `
    query {
      ChallengerContract_ChallengeCreated {
        id
        challengeId
        creator
        description
        targetDistance
        stakeAmount
        duration
      }
    }
  `;
  return queryGraphQL(query);
}

/**
 * Get all users who joined (optionally filtered by challengeId or user)
 */
export async function getUserJoined({ challengeId = null, user = null } = {}) {
  const filters = [];
  if (challengeId) filters.push(`challengeId: { _eq: "${challengeId}" }`);
  if (user) filters.push(`user: { _eq: "${user}" }`);

  const whereClause = filters.length ? `(where: { ${filters.join(", ")} })` : "";

  const query = `
    query {
      ChallengerContract_UserJoined ${whereClause} {
        id
        challengeId
        user
        stakedAmount
      }
    }
  `;
  return queryGraphQL(query);
}

/**
 * Get challenge finalized events
 */
export async function getFinalizedChallenges() {
  const query = `
    query {
      ChallengerContract_ChallengeFinalized {
        id
        challengeId
        totalParticipants
        successfulParticipants
      }
    }
  `;
  return queryGraphQL(query);
}

/**
 * Get task completed events for a specific user or challenge
 */
export async function getTaskCompleted({ challengeId = null, user = null } = {}) {
  const filters = [];
  if (challengeId) filters.push(`challengeId: { _eq: "${challengeId}" }`);
  if (user) filters.push(`user: { _eq: "${user}" }`);

  const whereClause = filters.length ? `(where: { ${filters.join(", ")} })` : "";

  const query = `
    query {
      ChallengerContract_TaskCompleted ${whereClause} {
        id
        challengeId
        user
      }
    }
  `;
  return queryGraphQL(query);
}

/**
 * Get winnings distributed for a challenge or user
 */
export async function getWinningsDistributed({ challengeId = null, user = null } = {}) {
  const filters = [];
  if (challengeId) filters.push(`challengeId: { _eq: "${challengeId}" }`);
  if (user) filters.push(`user: { _eq: "${user}" }`);

  const whereClause = filters.length ? `(where: { ${filters.join(", ")} })` : "";

  const query = `
    query {
      ChallengerContract_WinningsDistributed ${whereClause} {
        id
        challengeId
        user
        amount
      }
    }
  `;
  return queryGraphQL(query);
}

export default {
  getAllChallenges,
  getUserJoined,
  getFinalizedChallenges,
  getTaskCompleted,
  getWinningsDistributed,
};
