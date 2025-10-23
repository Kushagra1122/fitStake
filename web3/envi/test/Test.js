
const assert = require("assert");
const { TestHelpers } = require("generated");
const { MockDb, ChallengerContract } = TestHelpers;

describe("ChallengerContract contract ChallengeCreated event tests", () => {
  // Create mock db
  const mockDb = MockDb.createMockDb();

  // Creating mock for ChallengerContract contract ChallengeCreated event
  const event = ChallengerContract.ChallengeCreated.createMockEvent({/* It mocks event fields with default values. You can overwrite them if you need */});

  it("ChallengerContract_ChallengeCreated is created correctly", async () => {
    // Processing the event
    const mockDbUpdated = await ChallengerContract.ChallengeCreated.processEvent({
      event,
      mockDb,
    });

    // Getting the actual entity from the mock database
    let actualChallengerContractChallengeCreated = mockDbUpdated.entities.ChallengerContract_ChallengeCreated.get(
      `${event.chainId}_${event.block.number}_${event.logIndex}`
    );

    // Creating the expected entity
    const expectedChallengerContractChallengeCreated = {
      id:`${event.chainId}_${event.block.number}_${event.logIndex}`,
      challengeId: event.params.challengeId,
      creator: event.params.creator,
      description: event.params.description,
      targetDistance: event.params.targetDistance,
      stakeAmount: event.params.stakeAmount,
      duration: event.params.duration,
    };
    // Asserting that the entity in the mock database is the same as the expected entity
    assert.deepEqual(
      actualChallengerContractChallengeCreated,
      expectedChallengerContractChallengeCreated,
      "Actual ChallengerContractChallengeCreated should be the same as the expectedChallengerContractChallengeCreated"
    );
  });
});
