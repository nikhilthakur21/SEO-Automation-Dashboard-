import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { SESSION_COOKIE, verifySession } from './session';

export async function getSession() {
  return verifySession(cookies().get(SESSION_COOKIE)?.value);
}

export async function requireAdmin() {
  const session = await getSession();
  if (session?.role !== 'admin') redirect('/login');
  return session;
}

export async function requireClient() {
  const session = await getSession();
  if (session?.role !== 'client') redirect('/login');
  return session;
}

export function canViewAudit(session, audit) {
  return session?.role === 'admin' || (session?.role === 'client' && session.clientId === audit.clientId);
}
