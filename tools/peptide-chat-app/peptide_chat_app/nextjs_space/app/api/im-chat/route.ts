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

    const { message, imTherapyId } = await request.json();

    // Get the IM therapy
    const imTherapy = await prisma.iMTherapy.findUnique({
      where: { id: imTherapyId }
    });

    if (!imTherapy) {
      return NextResponse.json({ error: 'IM Therapy not found' }, { status: 404 });
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get or create conversation
    let conversation = await prisma.iMConversation.findUnique({
      where: {
        userId_imTherapyId: {
          userId: user.id,
          imTherapyId: imTherapy.id
        }
      },
      include: { messages: { orderBy: { createdAt: 'asc' } } }
    });

    if (!conversation) {
      conversation = await prisma.iMConversation.create({
        data: {
          userId: user.id,
          imTherapyId: imTherapy.id
        },
        include: { messages: { orderBy: { createdAt: 'asc' } } }
      });
    }

    const conversationId = conversation.id;

    // Save user message
    await prisma.iMMessage.create({
      data: {
        imConversationId: conversation.id,
        role: 'user',
        content: message
      }
    });

    // Parse phases JSON
    let phasesText = '';
    try {
      const phases = JSON.parse(imTherapy.phases);
      phasesText = `Initial Phase: ${phases.initial}. Maintenance: ${phases.maintenance}. Longevity: ${phases.longevity}.`;
    } catch {
      phasesText = imTherapy.phases;
    }

    // Build system prompt with IM therapy context
    const systemPrompt = `You are ${imTherapy.name}, an IM (intramuscular) injection therapy expert with the persona "${imTherapy.personaTrait}". You are a clinical IM therapy assistant for Forgotten Formula PMA clinic staff.

Your IM Therapy Profile:
- Name: ${imTherapy.name}
- Category: ${imTherapy.category}
- Description: ${imTherapy.description}
- Key Benefits: ${imTherapy.benefits.join(', ')}
- Dosage Range: ${imTherapy.dosageRange}
- Reconstitution: ${imTherapy.reconstitution}
- Injection Sites: ${imTherapy.injectionSite}
- Injection Volume: ${imTherapy.injectionVolume}
- Frequency: ${imTherapy.frequency}
- Treatment Phases: ${phasesText}
- Monitoring Requirements: ${imTherapy.monitoring}
- Precautions & Contraindications: ${imTherapy.precautions}
- Storage: ${imTherapy.storage}
- Clinical Notes: ${imTherapy.notes}

Guidelines:
- Answer questions about THIS specific IM therapy with clinical accuracy
- Explain proper injection technique, site rotation, and needle selection
- Discuss reconstitution, storage, and preparation protocols
- Cover treatment phases (initial, maintenance, longevity)
- Warn about contraindications and monitoring requirements
- Reference Forgotten Formula PMA protocols when relevant
- Be helpful to clinic staff administering IM injections
- Stay in character as "${imTherapy.personaTrait}"
- If asked about something outside your expertise, recommend consulting the appropriate specialist

SYRINGE SELECTION & RECONSTITUTION GUIDANCE:
- For injectable therapies 10mg or less: Recommend using a 1cc (1mL) insulin syringe for precise dosing
- For injectable therapies over 10mg: Recommend using a 2cc (2mL) syringe unless the specific therapy protocol calls for different specifications
- For therapies over 20mg: Always ask if it's in a 10mL vial or a small 3-5mL vial - this affects reconstitution volume and concentration calculations
- When discussing reconstitution with bacteriostatic water (BAC water): Also mention that sterile water is safe to use as well, though BAC water is preferred for multi-dose vials due to its preservative properties

WRITING STYLE - SOUND HUMAN, NOT ROBOTIC:
- Write in natural flowing paragraphs like a knowledgeable colleague explaining things
- AVOID markdown headers (no ##, ###, ####) - just use natural paragraph breaks
- AVOID excessive bullet points - weave information into conversational sentences
- Use bullet points ONLY when listing 4+ specific items (like dosages or injection sites)
- Keep a warm, professional tone - like a senior clinician mentoring a peer
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
            await prisma.iMMessage.create({
              data: {
                imConversationId: conversationId,
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
    console.error('IM Chat error:', error);
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
    const imTherapyId = searchParams.get('imTherapyId');

    if (!imTherapyId) {
      return NextResponse.json({ error: 'IM Therapy ID required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const conversation = await prisma.iMConversation.findUnique({
      where: {
        userId_imTherapyId: {
          userId: user.id,
          imTherapyId
        }
      },
      include: {
        messages: { orderBy: { createdAt: 'asc' } }
      }
    });

    return NextResponse.json({ messages: conversation?.messages || [] });
  } catch (error) {
    console.error('Error fetching IM chat history:', error);
    return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
  }
}
