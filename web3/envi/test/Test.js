
const assert = require("assert");
const { TestHelpers } = require("generated");
const { MockDb, Challengercc } = TestHelpers;

describe("Challengercc contract ChallengeCreated event tests", () => {
  // Create mock db
  const mockDb = MockDb.createMockDb();

  // Creating mock for Challengercc contract ChallengeCreated event
  const event = Challengercc.ChallengeCreated.createMockEvent({/* It mocks event fields with default values. You can overwrite them if you need */});

  it("Challengercc_ChallengeCreated is created correctly", async () => {
    // Processing the event
    const mockDbUpdated = await Challengercc.ChallengeCreated.processEvent({
      event,
      mockDb,
    });

    // Getting the actual entity from the mock database
    let actualChallengerccChallengeCreated = mockDbUpdated.entities.Challengercc_ChallengeCreated.get(
      `${event.chainId}_${event.block.number}_${event.logIndex}`
    );

    // Creating the expected entity
    const expectedChallengerccChallengeCreated = {
      id:`${event.chainId}_${event.block.number}_${event.logIndex}`,
      challengeId: event.params.challengeId,
      creator: event.params.creator,
      description: event.params.description,
      stakeAmount: event.params.stakeAmount,
      startTime: event.params.startTime,
      endTime: event.params.endTime,
      targetDistance: event.params.targetDistance,
    };
    // Asserting that the entity in the mock database is the same as the expected entity
    assert.deepEqual(
      actualChallengerccChallengeCreated,
      expectedChallengerccChallengeCreated,
      "Actual ChallengerccChallengeCreated should be the same as the expectedChallengerccChallengeCreated"
    );
  });
});
