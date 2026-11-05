import { AppShell } from '@/components/app-shell';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export default async function AdminLayout({ children }) {
  const session = await requireAdmin();
  const [clients, active] = await Promise.all([
    prisma.client.count(),
    prisma.audit.count({ where: { status: { in: ['QUEUED', 'RUNNING'] } } }),
  ]);

  return (
    <AppShell
      variant="admin"
      account={{ name: 'Admin', email: session.email }}
      topbar={{ title: 'Agency dashboard', subtitle: `Signed in as ${session.email}` }}
      action={{ href: '/admin/clients', label: 'Run an audit', short: 'Run', icon: 'play' }}
      counts={{ clients, active }}
    >
      {children}
    </AppShell>
  );
}
