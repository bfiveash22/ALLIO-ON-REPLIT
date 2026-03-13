import { scheduleDailyEcosystemEnhancement } from '../../artifacts/api-server/src/services/agent-scheduler';

async function main() {
  console.log("Triggering Daily Ecosystem Enhancement loop...");
  try {
    await scheduleDailyEcosystemEnhancement();
    console.log("Successfully queued 8 division enhancement tasks.");
  } catch (err) {
    console.error("Failed to trigger ecosystem loop:", err);
  }
  process.exit(0);
}

main();
