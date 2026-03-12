import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any)?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'users';

    if (type === 'users') {
      const users = await prisma.user.findMany({
        include: {
          conversations: {
            include: {
              messages: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      const csv = [
        'Name,Email,Signup Date,Total Conversations,Total Messages',
        ...users.map(user => {
          const totalConversations = user.conversations.length;
          const totalMessages = user.conversations.reduce((sum, conv) => sum + conv.messages.length, 0);
          return `"${user.name}","${user.email}","${user.createdAt.toISOString()}",${totalConversations},${totalMessages}`;
        })
      ].join('\n');

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="users-${new Date().toISOString().split('T')[0]}.csv"`
        }
      });
    }

    if (type === 'conversations') {
      const conversations = await prisma.conversation.findMany({
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
          messages: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      const csv = [
        'Conversation ID,User Name,User Email,Peptide Name,Peptide Era,Message Count,Started At,Last Updated',
        ...conversations.map(conv => {
          const lastMessage = conv.messages[conv.messages.length - 1];
          return `"${conv.id}","${conv.user.name}","${conv.user.email}","${conv.peptide.name}","${conv.peptide.era}",${conv.messages.length},"${conv.createdAt.toISOString()}","${lastMessage?.createdAt.toISOString() || conv.createdAt.toISOString()}"`;
        })
      ].join('\n');

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="conversations-${new Date().toISOString().split('T')[0]}.csv"`
        }
      });
    }

    if (type === 'messages') {
      const messages = await prisma.message.findMany({
        include: {
          conversation: {
            include: {
              user: {
                select: {
                  name: true,
                  email: true
                }
              },
              peptide: {
                select: {
                  name: true
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 5000 // Limit to most recent 5000 messages for performance
      });

      const csv = [
        'Message ID,User Name,User Email,Peptide Name,Role,Content Preview,Timestamp',
        ...messages.map(msg => {
          const contentPreview = msg.content.substring(0, 100).replace(/"/g, '""');
          return `"${msg.id}","${msg.conversation.user.name}","${msg.conversation.user.email}","${msg.conversation.peptide.name}","${msg.role}","${contentPreview}","${msg.createdAt.toISOString()}"`;
        })
      ].join('\n');

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="messages-${new Date().toISOString().split('T')[0]}.csv"`
        }
      });
    }

    return NextResponse.json({ error: 'Invalid export type' }, { status: 400 });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Failed to export data' }, { status: 500 });
  }
}
