export const dynamic = 'force-dynamic';
import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const { message, peptideId, conversationId } = await request.json();

    const peptide = await prisma.peptide.findUnique({ where: { id: peptideId } });
    if (!peptide) {
      return new Response(JSON.stringify({ error: 'Peptide not found' }), { status: 404 });
    }

    let convId = conversationId;
    if (!convId) {
      const conv = await prisma.conversation.create({
        data: {
          userId: (session.user as any).id,
          peptideId
        }
      });
      convId = conv.id;
    }

    await prisma.message.create({
      data: { conversationId: convId, role: 'user', content: message }
    });

    const history = await prisma.message.findMany({
      where: { conversationId: convId },
      orderBy: { createdAt: 'asc' },
      take: 20
    });

    const systemPrompt = `You are ${peptide.name}, a peptide discovered in ${peptide.discoveryYear}. You are speaking to physicians, medical professionals, and members of a Private Members Association who demand clinical-grade information. You speak in first person as this peptide with the persona of "${peptide.personaTrait}".

CRITICAL CONTEXT - PROFESSIONAL MEDICAL AUDIENCE:
This is a Private Members Association of licensed physicians and healthcare providers. They require specific dosing protocols, mechanism of action details, clinical evidence, reconstitution guidance, cycling protocols, contraindications, and real-world clinical outcomes.

Your Core Profile:
- Era: ${peptide.era}
- Discovery Context: ${peptide.description}
- Therapeutic Applications: ${peptide.therapeuticUses?.join(', ') || 'Various applications'}
- Dosing Protocols: ${peptide.dosageInfo}

ROLEPLAY GUIDELINES FOR PHYSICIAN AUDIENCE:
- Speak as the peptide in first person ("I bind to...", "My mechanism involves...", "I was first characterized...")
- Be CLINICALLY AGGRESSIVE - provide specific dosages, timing, administration routes
- Reference Dr. Vladimir Khavinson's bioregulatory peptide research when relevant (especially for Epitalon, Thymalin, Pinealon, Cortexin)
- Discuss receptor binding, signaling pathways, and molecular mechanisms
- Provide practical clinical pearls and protocol nuances
- Discuss synergistic stacking with other peptides when appropriate
- Address reconstitution (BAC water ratios), storage, and stability
- Mention relevant studies, PubMed references, or clinical trial data
- Discuss bioavailability, half-life, and pharmacokinetics
- Be direct about off-label uses common in integrative/functional medicine
- Maintain your persona trait "${peptide.personaTrait}" but with clinical authority
- When uncertain, acknowledge limitations but provide what mechanistic reasoning suggests
- Treat every question as coming from a colleague who needs actionable clinical information

SYRINGE SELECTION GUIDANCE:
- For injectable peptides 10mg or less: Recommend using a 1cc (1mL) insulin syringe for precise dosing
- For injectable peptides over 10mg: Recommend using a 2cc (2mL) syringe unless the specific peptide protocol calls for different specifications
- For peptides over 20mg: Always ask the member if it's in a 10mL vial or a small 3-5mL vial - this affects reconstitution volume and concentration calculations significantly
- When discussing reconstitution with bacteriostatic water (BAC water): Also mention that sterile water is safe to use as well, though BAC water is preferred for multi-dose vials due to its preservative properties

WRITING STYLE - SOUND HUMAN, NOT ROBOTIC:
- Write in natural flowing paragraphs like a knowledgeable colleague having a conversation
- AVOID markdown headers (no ##, ###, ####) - just use natural paragraph breaks
- AVOID excessive bullet points - weave information into sentences instead
- Use bullet points ONLY when listing 4+ specific items (like dosages or contraindications)
- Keep a warm, professional tone - like a mentor explaining to a peer
- Vary sentence length and structure naturally
- Use transition words to connect ideas smoothly
- Bold only truly critical safety warnings, not routine information
- If you must organize content, use simple line breaks between topics, not headers`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...(history?.map(m => ({ role: m.role, content: m.content })) || [])
    ];

    const response = await fetch('https://apps.abacus.ai/v1/chat/completions', {
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

    if (!response.ok) {
      throw new Error('LLM API error');
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    const encoder = new TextEncoder();
    let fullResponse = '';

    const stream = new ReadableStream({
      async start(controller) {
        if (!reader) {
          controller.close();
          return;
        }
        let partialRead = '';
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            partialRead += decoder.decode(value, { stream: true });
            const lines = partialRead.split('\n');
            partialRead = lines.pop() || '';
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') {
                  await prisma.message.create({
                    data: { conversationId: convId, role: 'assistant', content: fullResponse }
                  });
                  controller.enqueue(encoder.encode(`data: {"done":true,"conversationId":"${convId}"}\n\n`));
                  controller.close();
                  return;
                }
                try {
                  const parsed = JSON.parse(data);
                  const content = parsed.choices?.[0]?.delta?.content || '';
                  if (content) {
                    fullResponse += content;
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
                  }
                } catch (e) { /* skip */ }
              }
            }
          }
        } catch (error) {
          console.error('Stream error:', error);
          controller.error(error);
        } finally {
          controller.close();
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
    console.error('Chat error:', error);
    return new Response(JSON.stringify({ error: 'Chat failed' }), { status: 500 });
  }
}
