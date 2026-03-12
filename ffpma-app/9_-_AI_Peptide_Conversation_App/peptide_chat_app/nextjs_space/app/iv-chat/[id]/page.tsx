import { redirect, notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import IVChatClient from './iv-chat-client';

export const dynamic = 'force-dynamic';

export default async function IVChatPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/login');
  }

  const ivTherapy = await prisma.iVTherapy.findUnique({
    where: { id: params.id }
  });

  if (!ivTherapy) {
    notFound();
  }

  // Parse phases JSON for display
  let phases;
  try {
    phases = JSON.parse(ivTherapy.phases);
  } catch {
    phases = { initial: '', maintenance: '', longevity: '' };
  }

  return (
    <IVChatClient
      ivTherapy={{
        ...ivTherapy,
        phasesData: phases
      }}
    />
  );
}
