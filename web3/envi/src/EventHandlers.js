/*
 * Please refer to https://docs.envio.dev for a thorough guide on all Envio indexer features
 */
const {
 Challengercc,
} = require("generated");

Challengercc.ChallengeCreated.handler(async ({event, context}) => {
  const entity = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    challengeId: event.params.challengeId,
    creator: event.params.creator,
    description: event.params.description,
    stakeAmount: event.params.stakeAmount,
    startTime: event.params.startTime,
    endTime: event.params.endTime,
    targetDistance: event.params.targetDistance,
  };

  context.Challengercc_ChallengeCreated.set(entity);
});


Challengercc.ChallengeFinalized.handler(async ({event, context}) => {
  const entity = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    challengeId: event.params.challengeId,
    totalWinners: event.params.totalWinners,
    totalLosers: event.params.totalLosers,
  };

  context.Challengercc_ChallengeFinalized.set(entity);
});


Challengercc.TaskCompleted.handler(async ({event, context}) => {
  const entity = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    challengeId: event.params.challengeId,
    user: event.params.user,
    completionTimestamp: event.params.completionTimestamp,
    distance: event.params.distance,
    duration: event.params.duration,
    stravaActivityId: event.params.stravaActivityId,
  };

  context.Challengercc_TaskCompleted.set(entity);
});


Challengercc.UserJoined.handler(async ({event, context}) => {
  const entity = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    challengeId: event.params.challengeId,
    user: event.params.user,
    stakedAmount: event.params.stakedAmount,
  };

  context.Challengercc_UserJoined.set(entity);
});


Challengercc.WinningsDistributed.handler(async ({event, context}) => {
  const entity = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    challengeId: event.params.challengeId,
    winner: event.params.winner,
    amount: event.params.amount,
  };

  context.Challengercc_WinningsDistributed.set(entity);
});

