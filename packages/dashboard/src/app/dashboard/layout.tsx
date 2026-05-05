import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { SessionProvider } from 'next-auth/react';
import Sidebar from '@/components/sidebar/Sidebar';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect('/login');

  return (
    <SessionProvider session={session}>
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        <Sidebar />
        <main style={{ flex: 1, padding: '24px' }}>{children}</main>
      </div>
    </SessionProvider>
  );
}
