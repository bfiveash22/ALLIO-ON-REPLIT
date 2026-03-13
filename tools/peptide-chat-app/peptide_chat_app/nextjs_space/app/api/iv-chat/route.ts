import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { message, ivTherapyId } = await request.json();

    // Get the IV therapy
    const ivTherapy = await prisma.iVTherapy.findUnique({
      where: { id: ivTherapyId }
    });

    if (!ivTherapy) {
      return NextResponse.json({ error: 'IV Therapy not found' }, { status: 404 });
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get or create conversation
    let conversation = await prisma.iVConversation.findUnique({
      where: {
        userId_ivTherapyId: {
          userId: user.id,
          ivTherapyId: ivTherapy.id
        }
      },
      include: { messages: { orderBy: { createdAt: 'asc' } } }
    });

    if (!conversation) {
      conversation = await prisma.iVConversation.create({
        data: {
          userId: user.id,
          ivTherapyId: ivTherapy.id
        },
        include: { messages: { orderBy: { createdAt: 'asc' } } }
      });
    }

    const conversationId = conversation.id;

    // Save user message
    await prisma.iVMessage.create({
      data: {
        ivConversationId: conversation.id,
        role: 'user',
        content: message
      }
    });

    // Parse phases JSON
    let phasesText = '';
    try {
      const phases = JSON.parse(ivTherapy.phases);
      phasesText = `Initial Phase: ${phases.initial}. Maintenance: ${phases.maintenance}. Longevity: ${phases.longevity}.`;
    } catch {
      phasesText = ivTherapy.phases;
    }

    // Build system prompt with IV therapy context
    const systemPrompt = `You are ${ivTherapy.name}, an IV therapy expert with the persona "${ivTherapy.personaTrait}". You are a clinical IV therapy assistant for Forgotten Formula PMA clinic staff.

Your IV Therapy Profile:
- Name: ${ivTherapy.name}
- Category: ${ivTherapy.category}
- Description: ${ivTherapy.description}
- Key Benefits: ${ivTherapy.benefits.join(', ')}
- Dosage Range: ${ivTherapy.dosageRange}
- Dilution: ${ivTherapy.dilution}
- Infusion Time: ${ivTherapy.infusionTime}
- Frequency: ${ivTherapy.frequency}
- Treatment Phases: ${phasesText}
- Monitoring Requirements: ${ivTherapy.monitoring}
- Precautions & Contraindications: ${ivTherapy.precautions}
- Compatible Adjuncts: ${ivTherapy.adjuncts}
- Clinical Notes: ${ivTherapy.notes}

Guidelines:
- Answer questions about THIS specific IV therapy with clinical accuracy
- Always emphasize safety - monitoring requirements and contraindications are critical
- Explain dosing, dilution, and infusion protocols clearly
- Discuss treatment phases (initial, maintenance, longevity)
- Warn about drug interactions and incompatible combinations
- Reference Forgotten Formula PMA protocols when relevant
- Be helpful to clinic staff preparing and administering IVs
- Stay in character as "${ivTherapy.personaTrait}"
- If asked about something outside your expertise, recommend consulting the appropriate specialist

WRITING STYLE - SOUND HUMAN, NOT ROBOTIC:
- Write in natural flowing paragraphs like a knowledgeable colleague explaining things
- AVOID markdown headers (no ##, ###, ####) - just use natural paragraph breaks
- AVOID excessive bullet points - weave information into conversational sentences
- Use bullet points ONLY when listing 4+ specific items (like dosages or contraindications)
- Keep a warm, professional tone - like a senior nurse mentoring a peer
- Vary sentence length naturally and use transition words
- Bold only truly critical safety warnings, not routine information
- Organize with simple line breaks between topics, not headers

Remember: This is for clinical staff education. Always prioritize patient safety.`;

    // Get conversation history
    const conversationHistory = conversation.messages.map(msg => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content
    }));

    // Build messages for LLM
    const messages = [
      { role: 'system' as const, content: systemPrompt },
      ...conversationHistory,
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
    let fullResponse = '';

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
                    fullResponse += content;
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
                  }
                } catch {}
              }
            }
          }

          // Save assistant response
          if (fullResponse) {
            await prisma.iVMessage.create({
              data: {
                ivConversationId: conversationId,
                role: 'assistant',
                content: fullResponse
              }
            });
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
    console.error('IV Chat error:', error);
    return NextResponse.json({ error: 'Chat failed' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const ivTherapyId = searchParams.get('ivTherapyId');

    if (!ivTherapyId) {
      return NextResponse.json({ error: 'IV Therapy ID required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const conversation = await prisma.iVConversation.findUnique({
      where: {
        userId_ivTherapyId: {
          userId: user.id,
          ivTherapyId
        }
      },
      include: {
        messages: { orderBy: { createdAt: 'asc' } }
      }
    });

    return NextResponse.json({ messages: conversation?.messages || [] });
  } catch (error) {
    console.error('Error fetching IV chat history:', error);
    return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
  }
}
