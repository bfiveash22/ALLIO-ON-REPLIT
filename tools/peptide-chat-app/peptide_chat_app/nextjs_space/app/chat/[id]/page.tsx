import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import ChatClient from './chat-client';

export default async function ChatPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect('/login');
  }

  const peptide = await prisma.peptide.findUnique({
    where: { id: params.id }
  });

  if (!peptide) {
    redirect('/dashboard');
  }

  return <ChatClient peptide={{
    id: peptide.id,
    name: peptide.name,
    discoveryYear: peptide.discoveryYear,
    era: peptide.era,
    description: peptide.description,
    personaTrait: peptide.personaTrait,
    therapeuticUses: peptide.therapeuticUses,
    dosageInfo: peptide.dosageInfo
  }} />;
}
