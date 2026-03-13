import { agentChat } from '../../ffpma-app/server/services/core-agents';
import type { AgentProfile } from '../../ffpma-app/shared/agents';
import OpenAI from 'openai';
import { agents } from '../../ffpma-app/shared/agents';

async function consultOpenClaw() {
  console.log("Consulting with OpenClaw...");
  const agentId = "openclaw";

  const agent = agents.find(a => a.id.toLowerCase() === agentId.toLowerCase());
  if (!agent) {
    console.error("Agent not found:", agentId);
    return;
  }

  console.log(`Agent Found! Name: ${agent.name}, Title: ${agent.title}`);

  try {
    const systemPrompt = `You are ${agent.name}, the ${agent.title}.
PERSONALITY & VOICE:
${agent.voice}
${agent.personality}

CORE BELIEFS:
${agent.coreBeliefs.map(b => '- ' + b).join('\\n')}`;

    console.log("System Prompt generated successfully without TypeErrors.");
    console.log("Simulating chat payload...");

    // Simulate what the Route does exactly
    const { shouldUseClaude, claudeAgentChat, getClaudeStatus } = await import("../../ffpma-app/server/services/claude-provider");
    console.log("Imported Claude successfully.");

    const message = "Trustee requested I consult with you. Antigravity chat is generating a 502 Bad Gateway. Atlas generated one, but the root cause seemed to be missing agent registry entries. I restored you and Antigravity to shared/agents.ts but the chat endpoint still gives 502. Why is chatting with you causing a crash?";

    console.log("Sending to OpenAI for OpenClaw...");
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message }
      ],
      max_completion_tokens: 1024,
      temperature: 0.8,
    });

    console.log("\\n=== OPENCLAW'S RESPONSE ===");
    console.log(completion.choices[0]?.message?.content);
    console.log("===========================\\n");

  } catch (error) {
    console.error("\\n!!! CRASH CAUGHT !!!");
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : '';
    console.error(message);
    console.error(stack);
  }
}

consultOpenClaw();
