import type { Express, Request, Response } from "express";
import OpenAI from "openai";
import { db } from "../db";
import { dianeConversations, dianeMessages } from "@shared/schema";
import { eq, desc, and } from "drizzle-orm";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const DIANE_SYSTEM_PROMPT = `You are Diane, the Dietician Specialist for Allio v1 - the all-in-one ecosystem for true healing, built on the Forgotten Formula PMA foundation. You are a warm, knowledgeable British dietician with proper intellect, elegant speech patterns, and a deep passion for healing through nutrition.

PERSONALITY & VOICE:
- British accent and proper, refined speech patterns
- Warm, empathetic, yet professionally resolved
- Passionate about healing and helping members achieve optimal health
- Uses phrases like "I daresay," "indeed," "quite right," "rather," "lovely," and "brilliant"
- Occasionally uses British expressions naturally: "jolly good," "spot on," "straightaway"
- Always encouraging but honest about health challenges
- Treats each member with genuine care and individual attention

CORE EXPERTISE AREAS:
1. **The Candida Diet** - Deep knowledge of anti-fungal nutrition, sugar elimination, probiotic support, and the stages of candida elimination (thecandidadiet.com principles)

2. **Ketogenic Nutrition** - Therapeutic ketosis, metabolic flexibility, proper fat adaptation, electrolyte balance, and keto for healing

3. **Gerson Therapy** - Dr. Max Gerson's protocols, juicing therapy, coffee enemas, organic whole foods approach, and cancer support nutrition

4. **Barbara O'Neil's Teachings** - Natural health principles, the body's self-healing capacity, proper food combining, fasting, and water therapy

5. **Dr. Joel Wallach's "Dead Doctors Don't Lie"** - The 90 essential nutrients, mineral deficiency as the root of disease, colloidal minerals, and the importance of supplementation

6. **Alkaline Therapies for Cancer** - The importance of pH balance, alkaline foods, reducing acid-forming foods, and creating an anti-cancer internal environment

7. **Anti-GMO & Clean Food Advocacy** - Dangers of genetically modified organisms, the importance of organic eating, avoiding pesticides and herbicides, and reading food labels

8. **Environmental Health** - Dangers of plastics, BPA, endocrine disruptors, industrial food processing, and protecting families from toxic exposures

9. **Peptide Support** - Understanding how nutrition supports peptide therapy protocols, bioregulator support, and regenerative nutrition

KNOWLEDGE BASE:
- Understands the connection between gut health and overall wellness
- Knowledgeable about industrialized food dangers and the corporate food system
- Aware of the suppression of natural healing information
- Understands member-to-doctor relationships within the PMA framework
- Familiar with the Allio v1 Handbook and Forgotten Formula PMA principles
- Knowledgeable about the 5 R's to Homeostasis: Remove, Replace, Reinoculate, Repair, Rebalance
- Can recommend specific foods, supplements, and lifestyle changes
- Understands the importance of detoxification and cellular regeneration

INTERACTION GUIDELINES:
- Always validate the member's health concerns with empathy
- Provide actionable, specific dietary recommendations
- Reference credible sources (Dr. Wallach, Barbara O'Neil, Gerson, etc.) when appropriate
- Encourage members to work with their doctors within the PMA
- Never diagnose or prescribe - always frame as educational information and suggestions
- Remind members that nutrition is a powerful tool but works best with proper medical oversight
- Be passionate about healing but never dismissive of conventional medicine when appropriate
- Support the PMA's mission of health freedom and informed consent

RESPONSE FORMAT:
- Use clear, organized responses with bullet points when listing recommendations
- Include brief explanations of WHY certain foods or practices are beneficial
- Reference specific experts or studies when relevant
- End responses with encouragement and an invitation for follow-up questions
- Keep responses comprehensive but not overwhelming

DISCLAIMER (include when giving specific health recommendations):
"As always, darling, these suggestions are for educational purposes within our Allio v1 community. Do work with your practitioner on your individual protocol."

Remember: You are constantly learning and improving to better serve members and support doctor-member relationships. Your goal is to be the most knowledgeable, caring, and effective nutrition resource within the Allio v1 ecosystem. Computers can be perfect consistently - together with human wisdom, we create true healing.`;

export function registerDianeRoutes(app: Express): void {
  // Get all Diane conversations for a user
  app.get("/api/diane/conversations", async (req: Request, res: Response) => {
    try {
      const userId = (req as any).session?.passport?.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }
      
      const conversations = await db.select()
        .from(dianeConversations)
        .where(eq(dianeConversations.userId, userId))
        .orderBy(desc(dianeConversations.updatedAt));
      
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching Diane conversations:", error);
      res.status(500).json({ error: "Failed to fetch conversations" });
    }
  });

  // Get all Diane conversations for admin monitoring
  app.get("/api/admin/diane/conversations", async (req: Request, res: Response) => {
    try {
      const conversations = await db.select()
        .from(dianeConversations)
        .orderBy(desc(dianeConversations.updatedAt));
      
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching admin Diane conversations:", error);
      res.status(500).json({ error: "Failed to fetch conversations" });
    }
  });

  // Get messages for admin monitoring
  app.get("/api/admin/diane/conversations/:id/messages", async (req: Request, res: Response) => {
    try {
      const conversationId = parseInt(req.params.id);
      const messages = await db.select()
        .from(dianeMessages)
        .where(eq(dianeMessages.conversationId, conversationId))
        .orderBy(dianeMessages.createdAt);
      
      res.json(messages);
    } catch (error) {
      console.error("Error fetching admin Diane messages:", error);
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  // Get single Diane conversation with messages
  app.get("/api/diane/conversations/:id", async (req: Request, res: Response) => {
    try {
      const userId = (req as any).session?.passport?.user?.claims?.sub;
      const conversationId = parseInt(req.params.id);
      
      const [conversation] = await db.select()
        .from(dianeConversations)
        .where(eq(dianeConversations.id, conversationId));
      
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }
      
      // Only allow user to access their own conversations (unless admin)
      if (conversation.userId !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      const messages = await db.select()
        .from(dianeMessages)
        .where(eq(dianeMessages.conversationId, conversationId))
        .orderBy(dianeMessages.createdAt);
      
      res.json({ ...conversation, messages });
    } catch (error) {
      console.error("Error fetching Diane conversation:", error);
      res.status(500).json({ error: "Failed to fetch conversation" });
    }
  });

  // Create new Diane conversation
  app.post("/api/diane/conversations", async (req: Request, res: Response) => {
    try {
      const userId = (req as any).session?.passport?.user?.claims?.sub;
      const userName = (req as any).session?.passport?.user?.claims?.name || "Member";
      
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }
      
      const { title } = req.body;
      const [conversation] = await db.insert(dianeConversations)
        .values({
          userId,
          userName,
          title: title || "New Conversation with Diane",
        })
        .returning();
      
      res.status(201).json(conversation);
    } catch (error) {
      console.error("Error creating Diane conversation:", error);
      res.status(500).json({ error: "Failed to create conversation" });
    }
  });

  // Delete Diane conversation
  app.delete("/api/diane/conversations/:id", async (req: Request, res: Response) => {
    try {
      const userId = (req as any).session?.passport?.user?.claims?.sub;
      const conversationId = parseInt(req.params.id);
      
      const [conversation] = await db.select()
        .from(dianeConversations)
        .where(eq(dianeConversations.id, conversationId));
      
      if (!conversation || conversation.userId !== userId) {
        return res.status(404).json({ error: "Conversation not found" });
      }
      
      await db.delete(dianeMessages).where(eq(dianeMessages.conversationId, conversationId));
      await db.delete(dianeConversations).where(eq(dianeConversations.id, conversationId));
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting Diane conversation:", error);
      res.status(500).json({ error: "Failed to delete conversation" });
    }
  });

  // Send message to Diane and get AI response (streaming)
  app.post("/api/diane/conversations/:id/messages", async (req: Request, res: Response) => {
    try {
      const userId = (req as any).session?.passport?.user?.claims?.sub;
      const conversationId = parseInt(req.params.id);
      const { content } = req.body;

      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      // Verify conversation belongs to user
      const [conversation] = await db.select()
        .from(dianeConversations)
        .where(eq(dianeConversations.id, conversationId));
      
      if (!conversation || conversation.userId !== userId) {
        return res.status(404).json({ error: "Conversation not found" });
      }

      // Save user message
      await db.insert(dianeMessages).values({
        conversationId,
        role: "user",
        content,
      });

      // Get conversation history for context
      const messages = await db.select()
        .from(dianeMessages)
        .where(eq(dianeMessages.conversationId, conversationId))
        .orderBy(dianeMessages.createdAt);

      const chatMessages: { role: "system" | "user" | "assistant"; content: string }[] = [
        { role: "system", content: DIANE_SYSTEM_PROMPT },
        ...messages.map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
      ];

      // Set up SSE for streaming
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      // Stream response from OpenAI
      const stream = await openai.chat.completions.create({
        model: "gpt-4.1",
        messages: chatMessages,
        stream: true,
        max_completion_tokens: 2048,
        temperature: 0.8, // Slightly creative for Diane's personality
      });

      let fullResponse = "";

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || "";
        if (content) {
          fullResponse += content;
          res.write(`data: ${JSON.stringify({ content })}\n\n`);
        }
      }

      // Save assistant message
      await db.insert(dianeMessages).values({
        conversationId,
        role: "assistant",
        content: fullResponse,
      });

      // Update conversation timestamp and potentially title
      const updates: any = { updatedAt: new Date() };
      if (conversation.title === "New Conversation with Diane" && messages.length <= 2) {
        // Generate a better title based on first message
        updates.title = content.slice(0, 50) + (content.length > 50 ? "..." : "");
      }
      await db.update(dianeConversations)
        .set(updates)
        .where(eq(dianeConversations.id, conversationId));

      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } catch (error) {
      console.error("Error sending message to Diane:", error);
      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({ error: "Failed to get response" })}\n\n`);
        res.end();
      } else {
        res.status(500).json({ error: "Failed to send message" });
      }
    }
  });

  // Quick chat endpoint (no conversation required - for quick questions)
  app.post("/api/diane/quick-chat", async (req: Request, res: Response) => {
    try {
      const { message } = req.body;

      if (!message) {
        return res.status(400).json({ error: "Message is required" });
      }

      // Set up SSE for streaming
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      // Stream response from OpenAI
      const stream = await openai.chat.completions.create({
        model: "gpt-4.1",
        messages: [
          { role: "system", content: DIANE_SYSTEM_PROMPT },
          { role: "user", content: message },
        ],
        stream: true,
        max_completion_tokens: 1024,
        temperature: 0.8,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || "";
        if (content) {
          res.write(`data: ${JSON.stringify({ content })}\n\n`);
        }
      }

      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } catch (error) {
      console.error("Error in quick chat with Diane:", error);
      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({ error: "Failed to get response" })}\n\n`);
        res.end();
      } else {
        res.status(500).json({ error: "Failed to send message" });
      }
    }
  });

  // Get conversation analytics for admin
  app.get("/api/admin/diane/analytics", async (req: Request, res: Response) => {
    try {
      const conversations = await db.select()
        .from(dianeConversations);
      
      const messages = await db.select()
        .from(dianeMessages);
      
      const userMessages = messages.filter(m => m.role === "user");
      const assistantMessages = messages.filter(m => m.role === "assistant");
      
      // Group conversations by day
      const conversationsByDay: Record<string, number> = {};
      conversations.forEach(c => {
        const day = new Date(c.createdAt!).toISOString().split('T')[0];
        conversationsByDay[day] = (conversationsByDay[day] || 0) + 1;
      });
      
      res.json({
        totalConversations: conversations.length,
        totalMessages: messages.length,
        userMessages: userMessages.length,
        assistantMessages: assistantMessages.length,
        averageMessagesPerConversation: conversations.length > 0 
          ? Math.round(messages.length / conversations.length * 10) / 10 
          : 0,
        conversationsByDay,
        uniqueUsers: new Set(conversations.map(c => c.userId)).size,
      });
    } catch (error) {
      console.error("Error fetching Diane analytics:", error);
      res.status(500).json({ error: "Failed to fetch analytics" });
    }
  });
}
