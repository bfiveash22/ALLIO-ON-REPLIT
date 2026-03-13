import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { redirect } from 'next/navigation';
import AdminDashboard from './admin-client';

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/login');
  }

  // Check if user is admin
  if (!(session.user as any)?.isAdmin) {
    redirect('/dashboard');
  }

  return <AdminDashboard userName={session.user?.name || 'Admin'} />;
}
