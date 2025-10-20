import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const ChallengeContractModule = buildModule("ChallengeContractModule", (m) => {
  const challengeContract = m.contract("ChallengeContract");

  return { challengeContract };
});

export default ChallengeContractModule;
