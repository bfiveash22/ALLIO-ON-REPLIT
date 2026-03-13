import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any)?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get total users
    const totalUsers = await prisma.user.count();

    // Get users by signup date (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentUsers = await prisma.user.findMany({
      where: {
        createdAt: {
          gte: thirtyDaysAgo
        }
      },
      select: {
        createdAt: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    // Group by date
    const signupsByDate: Record<string, number> = {};
    recentUsers.forEach(user => {
      const date = user.createdAt.toISOString().split('T')[0];
      signupsByDate[date] = (signupsByDate[date] || 0) + 1;
    });

    // Get total conversations
    const totalConversations = await prisma.conversation.count();

    // Get total messages
    const totalMessages = await prisma.message.count();

    // Get conversations per peptide
    const conversationsPerPeptide = await prisma.conversation.groupBy({
      by: ['peptideId'],
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      },
      take: 10
    });

    // Get peptide details for the top conversations
    const peptideIds = conversationsPerPeptide.map(c => c.peptideId);
    const peptides = await prisma.peptide.findMany({
      where: {
        id: {
          in: peptideIds
        }
      },
      select: {
        id: true,
        name: true,
        era: true
      }
    });

    const peptideMap = new Map(peptides.map(p => [p.id, p]));
    const popularPeptides = conversationsPerPeptide.map(c => ({
      peptide: peptideMap.get(c.peptideId),
      conversationCount: c._count.id
    }));

    // Get messages per peptide (through conversations)
    const messagesPerPeptide = await prisma.message.groupBy({
      by: ['conversationId'],
      _count: {
        id: true
      }
    });

    // Map conversation IDs to peptides
    const conversations = await prisma.conversation.findMany({
      select: {
        id: true,
        peptideId: true
      }
    });

    const conversationToPeptide = new Map(conversations.map(c => [c.id, c.peptideId]));
    const peptideMessageCounts: Record<string, number> = {};
    
    messagesPerPeptide.forEach(m => {
      const peptideId = conversationToPeptide.get(m.conversationId);
      if (peptideId) {
        peptideMessageCounts[peptideId] = (peptideMessageCounts[peptideId] || 0) + m._count.id;
      }
    });

    // Get recent activity (last 20 conversations with details)
    const recentActivity = await prisma.conversation.findMany({
      take: 20,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        },
        peptide: {
          select: {
            name: true,
            era: true
          }
        },
        messages: {
          select: {
            id: true
          }
        }
      }
    });

    // Calculate average messages per conversation
    const avgMessagesPerConversation = totalConversations > 0 
      ? Math.round(totalMessages / totalConversations) 
      : 0;

    // Get active users (users who have conversations)
    const activeUsers = await prisma.user.count({
      where: {
        conversations: {
          some: {}
        }
      }
    });

    return NextResponse.json({
      totalUsers,
      activeUsers,
      totalConversations,
      totalMessages,
      avgMessagesPerConversation,
      signupsByDate,
      popularPeptides,
      peptideMessageCounts,
      recentActivity: recentActivity.map(activity => ({
        id: activity.id,
        userName: activity.user.name,
        userEmail: activity.user.email,
        peptideName: activity.peptide.name,
        peptideEra: activity.peptide.era,
        messageCount: activity.messages.length,
        createdAt: activity.createdAt
      }))
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
