
import envioService from "./envioService.js";
  
export async function runTests() {
  console.log("=== Testing getAllChallenges ===");
  const challenges = await envioService.getAllChallenges(5);
  console.log(challenges);

  console.log("\n=== Testing getUserJoined ===");
  const joined = await envioService.getUserJoined({ limit: 5 });
  console.log(joined);

  console.log("\n=== Testing getFinalizedChallenges ===");
  const finalized = await envioService.getFinalizedChallenges(5);
  console.log(finalized);

  console.log("\n=== Testing getTaskCompleted ===");
  const tasks = await envioService.getTaskCompleted({ limit: 5 });
  console.log(tasks);

  console.log("\n=== Testing getWinningsDistributed ===");
  const winnings = await envioService.getWinningsDistributed({ limit: 5 });
  console.log(winnings);

  console.log("\n=== Testing getProfileData ===");
  const profile = await envioService.getProfileData(0x0238038828a978527dfe10365be3c94337a3c0b8, 5);
  console.log(profile);
}

