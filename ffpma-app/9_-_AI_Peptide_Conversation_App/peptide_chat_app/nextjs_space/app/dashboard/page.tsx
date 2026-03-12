import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { redirect } from 'next/navigation';
import DashboardClient from './dashboard-client';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect('/login');
  }
  const isAdmin = (session?.user as any)?.isAdmin || false;
  return <DashboardClient userName={session?.user?.name || 'Explorer'} isAdmin={isAdmin} />;
}
