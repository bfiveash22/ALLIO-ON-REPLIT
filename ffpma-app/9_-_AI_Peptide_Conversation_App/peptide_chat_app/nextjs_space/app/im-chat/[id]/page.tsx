import { redirect, notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import IMChatClient from './im-chat-client';

export const dynamic = 'force-dynamic';

export default async function IMChatPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/login');
  }

  const imTherapy = await prisma.iMTherapy.findUnique({
    where: { id: params.id }
  });

  if (!imTherapy) {
    notFound();
  }

  // Parse phases JSON for display
  let phases;
  try {
    phases = JSON.parse(imTherapy.phases);
  } catch {
    phases = { initial: '', maintenance: '', longevity: '' };
  }

  return (
    <IMChatClient
      imTherapy={{
        ...imTherapy,
        phasesData: phases
      }}
    />
  );
}
