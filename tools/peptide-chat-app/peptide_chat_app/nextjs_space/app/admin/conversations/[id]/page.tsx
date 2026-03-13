import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import ConversationViewer from './conversation-viewer';

export default async function ConversationViewPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/login');
  }

  // Check if user is admin
  const user = await prisma.user.findUnique({
    where: { email: session.user.email! },
    select: { isAdmin: true }
  });

  if (!user?.isAdmin) {
    redirect('/dashboard');
  }

  return <ConversationViewer conversationId={params.id} />;
}
