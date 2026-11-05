import { AdminShell } from '@/components/admin-shell';
import { requireAdmin } from '@/lib/auth';

export default async function AdminLayout({ children }) {
  const session = await requireAdmin();
  return <AdminShell email={session.email}>{children}</AdminShell>;
}
