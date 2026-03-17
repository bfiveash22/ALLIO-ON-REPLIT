import 'dotenv/config';
import { rupaHealthAgent } from '../services/rupa-health-agent';

async function testRupaHealthAgent() {
    console.log("Testing Rupa Health Agent...");

    // Testing with a hypothetical member and standard panel
    const patientDetails = {
        firstName: "Test",
        lastName: "Patient",
        email: "test@example.com"
    };

    const testPanels = ["Comprehensive Metabolic Panel (CMP)"];

    // Call the agent with dryRun = true
    const result = await rupaHealthAgent.placeOrder(patientDetails, testPanels, true);

    console.log("Agent Result:", JSON.stringify(result, null, 2));
}

testRupaHealthAgent().catch(console.error);
