import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { network } from "hardhat";

describe("ChallengeContract", async function () {
  const { viem } = await network.connect();
  const publicClient = await viem.getPublicClient();

  // Test accounts
  const [owner, oracle, user1, user2, user3] = await viem.getWalletClients();

  describe("Deployment", function () {
    it("Should set the correct owner", async function () {
      const contract = await viem.deployContract("ChallengeContract");
      const contractOwner = await contract.read.owner();
      assert.equal(contractOwner.toLowerCase(), owner.account.address.toLowerCase());
    });

    it("Should initialize nextChallengeId to 1", async function () {
      const contract = await viem.deployContract("ChallengeContract");
      const nextId = await contract.read.nextChallengeId();
      assert.equal(nextId, 1n);
    });

    it("Should have zero authorized oracle initially", async function () {
      const contract = await viem.deployContract("ChallengeContract");
      const oracleAddress = await contract.read.authorizedOracle();
      assert.equal(oracleAddress, "0x0000000000000000000000000000000000000000");
    });
  });

  describe("Challenge Creation", function () {
    it("Should create a challenge successfully", async function () {
      const contract = await viem.deployContract("ChallengeContract");
      const description = "Run 5km today";
      const targetDistance = 5000n; // 5km in meters
      const stakeAmount = 1000000000000000000n; // 1 ETH
      const duration = 86400n; // 24 hours

      await contract.write.createChallenge([
        description,
        targetDistance,
        stakeAmount,
        duration
      ]);

      const challenge = await contract.read.getChallenge([1n]);
      
      assert.equal(challenge.challengeId, 1n);
      assert.equal(challenge.creator.toLowerCase(), owner.account.address.toLowerCase());
      assert.equal(challenge.description, description);
      assert.equal(challenge.targetDistance, targetDistance);
      assert.equal(challenge.stakeAmount, stakeAmount);
      assert.equal(challenge.participantCount, 0n);
      assert.equal(challenge.finalized, false);
    });

    it("Should reject challenge with zero target distance", async function () {
      const contract = await viem.deployContract("ChallengeContract");
      await assert.rejects(
        contract.write.createChallenge([
          "Invalid challenge",
          0n,
          1000000000000000000n,
          86400n
        ]),
        /Target distance must be greater than 0/
      );
    });

    it("Should reject challenge with zero stake amount", async function () {
      const contract = await viem.deployContract("ChallengeContract");
      await assert.rejects(
        contract.write.createChallenge([
          "Invalid challenge",
          5000n,
          0n,
          86400n
        ]),
        /Stake amount must be greater than 0/
      );
    });

    it("Should reject challenge with zero duration", async function () {
      const contract = await viem.deployContract("ChallengeContract");
      await assert.rejects(
        contract.write.createChallenge([
          "Invalid challenge",
          5000n,
          1000000000000000000n,
          0n
        ]),
        /Duration must be greater than 0/
      );
    });
  });

  describe("Joining Challenges", function () {
    it("Should allow user to join with correct stake amount", async function () {
      const contract = await viem.deployContract("ChallengeContract");
      
      // Create challenge
      await contract.write.createChallenge([
        "Run 5km today",
        5000n,
        1000000000000000000n, // 1 ETH
        86400n
      ]);

      // Join challenge using user1 account
      await contract.write.joinChallenge([1n], {
        value: 1000000000000000000n,
        account: user1.account
      });

      const participant = await contract.read.getParticipant([1n, user1.account.address]);
      assert.equal(participant.userAddress.toLowerCase(), user1.account.address.toLowerCase());
      assert.equal(participant.stakedAmount, 1000000000000000000n);
      assert.equal(participant.hasCompleted, false);
      assert.equal(participant.hasWithdrawn, false);

      const challenge = await contract.read.getChallenge([1n]);
      assert.equal(challenge.participantCount, 1n);
      assert.equal(challenge.totalStaked, 1000000000000000000n);
    });

    it("Should reject joining with incorrect stake amount", async function () {
      const contract = await viem.deployContract("ChallengeContract");
      
      await contract.write.createChallenge([
        "Run 5km today",
        5000n,
        1000000000000000000n,
        86400n
      ]);

      await assert.rejects(
        contract.write.joinChallenge([1n], {
          value: 500000000000000000n, // 0.5 ETH instead of 1 ETH
          account: user1.account
        }),
        /Incorrect stake amount/
      );
    });

    it("Should reject joining non-existent challenge", async function () {
      const contract = await viem.deployContract("ChallengeContract");
      
      await assert.rejects(
        contract.write.joinChallenge([999n], {
          value: 1000000000000000000n,
          account: user1.account
        }),
        /Challenge does not exist/
      );
    });

    it("Should reject joining same challenge twice", async function () {
      const contract = await viem.deployContract("ChallengeContract");
      
      await contract.write.createChallenge([
        "Run 5km today",
        5000n,
        1000000000000000000n,
        86400n
      ]);

      await contract.write.joinChallenge([1n], {
        value: 1000000000000000000n,
        account: user1.account
      });

      await assert.rejects(
        contract.write.joinChallenge([1n], {
          value: 1000000000000000000n,
          account: user1.account
        }),
        /Already joined this challenge/
      );
    });

    it("Should allow multiple users to join", async function () {
      const contract = await viem.deployContract("ChallengeContract");
      
      await contract.write.createChallenge([
        "Run 5km today",
        5000n,
        1000000000000000000n,
        86400n
      ]);

      await contract.write.joinChallenge([1n], {
        value: 1000000000000000000n,
        account: user1.account
      });

      await contract.write.joinChallenge([1n], {
        value: 1000000000000000000n,
        account: user2.account
      });

      const challenge = await contract.read.getChallenge([1n]);
      assert.equal(challenge.participantCount, 2n);
      assert.equal(challenge.totalStaked, 2000000000000000000n);
    });
  });

  describe("Oracle Verification", function () {
    it("Should allow oracle to mark task completion", async function () {
      const contract = await viem.deployContract("ChallengeContract");
      
      // Set oracle address
      await contract.write.setOracleAddress([oracle.account.address]);
      
      await contract.write.createChallenge([
        "Run 5km today",
        5000n,
        1000000000000000000n,
        86400n
      ]);

      await contract.write.joinChallenge([1n], {
        value: 1000000000000000000n,
        account: user1.account
      });

      // Use oracle account to mark completion
      await contract.write.markTaskComplete([1n, user1.account.address], {
        account: oracle.account
      });

      const participant = await contract.read.getParticipant([1n, user1.account.address]);
      assert.equal(participant.hasCompleted, true);
    });

    it("Should reject non-oracle from marking completion", async function () {
      const contract = await viem.deployContract("ChallengeContract");
      
      await contract.write.createChallenge([
        "Run 5km today",
        5000n,
        1000000000000000000n,
        86400n
      ]);

      await contract.write.joinChallenge([1n], {
        value: 1000000000000000000n,
        account: user1.account
      });

      await assert.rejects(
        contract.write.markTaskComplete([1n, user1.account.address], {
          account: user1.account
        }),
        /Only authorized oracle can call this function/
      );
    });

    it("Should reject marking completion for non-participant", async function () {
      const contract = await viem.deployContract("ChallengeContract");
      
      // Set oracle address
      await contract.write.setOracleAddress([oracle.account.address]);
      
      await contract.write.createChallenge([
        "Run 5km today",
        5000n,
        1000000000000000000n,
        86400n
      ]);

      await assert.rejects(
        contract.write.markTaskComplete([1n, user2.account.address], {
          account: oracle.account
        }),
        /User not a participant/
      );
    });

    it("Should reject marking completion twice", async function () {
      const contract = await viem.deployContract("ChallengeContract");
      
      // Set oracle address
      await contract.write.setOracleAddress([oracle.account.address]);
      
      await contract.write.createChallenge([
        "Run 5km today",
        5000n,
        1000000000000000000n,
        86400n
      ]);

      await contract.write.joinChallenge([1n], {
        value: 1000000000000000000n,
        account: user1.account
      });

      await contract.write.markTaskComplete([1n, user1.account.address], {
        account: oracle.account
      });

      await assert.rejects(
        contract.write.markTaskComplete([1n, user1.account.address], {
          account: oracle.account
        }),
        /User already marked as completed/
      );
    });
  });

  describe("Oracle Management", function () {
    it("Should allow owner to set oracle address", async function () {
      const contract = await viem.deployContract("ChallengeContract");
      
      await contract.write.setOracleAddress([oracle.account.address]);
      
      const oracleAddress = await contract.read.authorizedOracle();
      assert.equal(oracleAddress.toLowerCase(), oracle.account.address.toLowerCase());
    });

    it("Should reject non-owner from setting oracle address", async function () {
      const contract = await viem.deployContract("ChallengeContract");
      
      await assert.rejects(
        contract.write.setOracleAddress([oracle.account.address], {
          account: user1.account
        }),
        /Only owner can call this function/
      );
    });

    it("Should reject setting zero address as oracle", async function () {
      const contract = await viem.deployContract("ChallengeContract");
      
      await assert.rejects(
        contract.write.setOracleAddress(["0x0000000000000000000000000000000000000000"]),
        /Oracle address cannot be zero/
      );
    });
  });

  describe("View Functions", function () {
    it("Should return challenge details", async function () {
      const contract = await viem.deployContract("ChallengeContract");
      
      await contract.write.createChallenge([
        "Run 5km today",
        5000n,
        1000000000000000000n,
        86400n
      ]);

      const challenge = await contract.read.getChallenge([1n]);
      
      assert.equal(challenge.challengeId, 1n);
      assert.equal(challenge.creator.toLowerCase(), owner.account.address.toLowerCase());
      assert.equal(challenge.description, "Run 5km today");
      assert.equal(challenge.targetDistance, 5000n);
      assert.equal(challenge.stakeAmount, 1000000000000000000n);
    });

    it("Should return participant details", async function () {
      const contract = await viem.deployContract("ChallengeContract");
      
      await contract.write.createChallenge([
        "Run 5km today",
        5000n,
        1000000000000000000n,
        86400n
      ]);

      await contract.write.joinChallenge([1n], {
        value: 1000000000000000000n,
        account: user1.account
      });

      const participant = await contract.read.getParticipant([1n, user1.account.address]);
      
      assert.equal(participant.userAddress.toLowerCase(), user1.account.address.toLowerCase());
      assert.equal(participant.stakedAmount, 1000000000000000000n);
      assert.equal(participant.hasCompleted, false);
      assert.equal(participant.hasWithdrawn, false);
    });

    it("Should return challenge participants", async function () {
      const contract = await viem.deployContract("ChallengeContract");
      
      await contract.write.createChallenge([
        "Run 5km today",
        5000n,
        1000000000000000000n,
        86400n
      ]);

      await contract.write.joinChallenge([1n], {
        value: 1000000000000000000n,
        account: user1.account
      });

      const participants = await contract.read.getChallengeParticipants([1n]);
      
      assert.equal(participants.length, 1);
      assert.equal(participants[0].toLowerCase(), user1.account.address.toLowerCase());
    });

    it("Should check if user is participant", async function () {
      const contract = await viem.deployContract("ChallengeContract");
      
      await contract.write.createChallenge([
        "Run 5km today",
        5000n,
        1000000000000000000n,
        86400n
      ]);

      await contract.write.joinChallenge([1n], {
        value: 1000000000000000000n,
        account: user1.account
      });

      const isParticipant1 = await contract.read.isParticipant([1n, user1.account.address]);
      const isParticipant2 = await contract.read.isParticipant([1n, user2.account.address]);
      
      assert.equal(isParticipant1, true);
      assert.equal(isParticipant2, false);
    });

    it("Should reject getting non-existent challenge", async function () {
      const contract = await viem.deployContract("ChallengeContract");
      
      await assert.rejects(
        contract.read.getChallenge([999n]),
        /Challenge does not exist/
      );
    });

    it("Should reject getting non-participant", async function () {
      const contract = await viem.deployContract("ChallengeContract");
      
      await contract.write.createChallenge([
        "Run 5km today",
        5000n,
        1000000000000000000n,
        86400n
      ]);

      await assert.rejects(
        contract.read.getParticipant([1n, user2.account.address]),
        /Not a participant/
      );
    });
  });
});