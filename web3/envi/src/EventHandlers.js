/*
 * Please refer to https://docs.envio.dev for a thorough guide on all Envio indexer features
 */
const {
 ChallengerContract,
} = require("generated");

ChallengerContract.ChallengeCreated.handler(async ({event, context}) => {
  const entity = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    challengeId: event.params.challengeId,
    creator: event.params.creator,
    description: event.params.description,
    targetDistance: event.params.targetDistance,
    stakeAmount: event.params.stakeAmount,
    duration: event.params.duration,
  };

  context.ChallengerContract_ChallengeCreated.set(entity);
});


ChallengerContract.ChallengeFinalized.handler(async ({event, context}) => {
  const entity = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    challengeId: event.params.challengeId,
    totalParticipants: event.params.totalParticipants,
    successfulParticipants: event.params.successfulParticipants,
  };

  context.ChallengerContract_ChallengeFinalized.set(entity);
});


ChallengerContract.TaskCompleted.handler(async ({event, context}) => {
  const entity = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    challengeId: event.params.challengeId,
    user: event.params.user,
  };

  context.ChallengerContract_TaskCompleted.set(entity);
});


ChallengerContract.UserJoined.handler(async ({event, context}) => {
  const entity = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    challengeId: event.params.challengeId,
    user: event.params.user,
    stakedAmount: event.params.stakedAmount,
  };

  context.ChallengerContract_UserJoined.set(entity);
});


ChallengerContract.WinningsDistributed.handler(async ({event, context}) => {
  const entity = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    challengeId: event.params.challengeId,
    user: event.params.user,
    amount: event.params.amount,
  };

  context.ChallengerContract_WinningsDistributed.set(entity);
});

