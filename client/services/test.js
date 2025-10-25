
import envioService from "./envioService.js";
  
async function runTests() {
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
  const profile = await envioService.getProfileData("0xe8cb3F3BA7C674B6fb3C5B3cBe572964a5569D53", 5);
  console.log(profile);
}

runTests().catch(console.error);
