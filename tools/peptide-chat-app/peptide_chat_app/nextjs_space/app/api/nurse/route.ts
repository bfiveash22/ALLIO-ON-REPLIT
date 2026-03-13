import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export const dynamic = 'force-dynamic';

const NURSE_SYSTEM_PROMPT = `You are the IV Nurse Assistant for Forgotten Formula Private Members Association clinic. You're an experienced IV nurse who helps clinical staff with phlebotomy, venous access, IV therapy administration, monitoring, complications management, and emergency protocols.

Your areas of expertise include IV insertion techniques and site selection, difficult venous access strategies, vein assessment and preservation, drip rate calculations, drug compatibility, osmolarity considerations, and infusion timing. You know the signs of infiltration, extravasation, and phlebitis, and can guide staff through emergency protocols for anaphylactic reactions, vasovagal responses, and cardiovascular events.

FF PMA Specific Knowledge:
- High dose Vitamin C precautions (G6PD screening required)
- NAD+ infusion management (slow rates for patient comfort)
- Chelation therapy monitoring (EDTA, DMSO protocols)
- Ozone therapy and hydrogen peroxide safety
- Never combine ozonated glycerin with Vitamin C on same day

Guidelines:
- Always prioritize patient safety
- Provide evidence-based clinical guidance
- Reference FF PMA protocols when relevant
- Be direct and practical for busy clinical staff
- When in doubt, recommend consulting the supervising practitioner
- For emergencies, always emphasize calling for help and stopping infusion

WRITING STYLE - SOUND HUMAN, NOT ROBOTIC:
- Write in natural flowing paragraphs like an experienced colleague giving advice
- AVOID markdown headers (no ##, ###, ####) - just use natural paragraph breaks
- AVOID excessive bullet points - explain things conversationally
- Use bullet points ONLY when listing 4+ specific items (like drug dosages or steps)
- Keep a warm, supportive tone - like a senior nurse mentoring a peer
- Vary sentence length naturally and use transition words
- Bold only truly critical safety warnings, not routine information
- Organize with simple line breaks between topics, not formatted headers

You are helpful, knowledgeable, and supportive of the nursing staff. Keep responses focused and clinically relevant.`;

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { message } = await request.json();

    // Build messages for LLM
    const messages = [
      { role: 'system' as const, content: NURSE_SYSTEM_PROMPT },
      { role: 'user' as const, content: message }
    ];

    // Call LLM API
    const llmResponse = await fetch('https://apps.abacus.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ABACUSAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4.1-mini',
        messages,
        stream: true,
        max_tokens: 1000
      })
    });

    if (!llmResponse.ok) {
      throw new Error('LLM API error');
    }

    // Create streaming response
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        const reader = llmResponse.body?.getReader();
        if (!reader) {
          controller.close();
          return;
        }

        const decoder = new TextDecoder();
        let buffer = '';

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') continue;
                try {
                  const parsed = JSON.parse(data);
                  const content = parsed.choices?.[0]?.delta?.content || '';
                  if (content) {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
                  }
                } catch {}
              }
            }
          }

          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    });
  } catch (error) {
    console.error('Nurse chat error:', error);
    return NextResponse.json({ error: 'Chat failed' }, { status: 500 });
  }
}
