try { require("dotenv/config"); } catch (_) {}
import { rupaHealthAgent } from '../services/rupa-health-agent';

async function testRupaHealthKathryn() {
    console.log("Testing Rupa Health Agent for Kathryn Smith...");

    const patientDetails = {
        firstName: "Kathryn",
        lastName: "Smith",
        email: "kathryn.smith@example.com"
    };

    const testPanels = [
        "Access Med Labs Comprehensive Female Hormone Panel",
        "Access Med Labs Heavy Metals Panel",
        "Access Med Labs Mineral Panel"
    ];

    // Call the agent with dryRun = true
    const result = await rupaHealthAgent.placeOrder(patientDetails, testPanels, true);

    console.log("Agent Result:", JSON.stringify(result, null, 2));
}

testRupaHealthKathryn().catch(console.error);
