'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { signSession, SESSION_COOKIE, SESSION_MAX_AGE } from '@/lib/session';

async function findAccount(email, password) {
  if (email === process.env.ADMIN_EMAIL?.toLowerCase() && password === process.env.ADMIN_PASSWORD) {
    return { session: { role: 'admin', email }, home: '/admin' };
  }
  if (process.env.CLIENT_PASSWORD && password === process.env.CLIENT_PASSWORD) {
    const client = await prisma.client.findFirst({ where: { email: { equals: email, mode: 'insensitive' } } });
    if (client) return { session: { role: 'client', clientId: client.id, name: client.name, email }, home: '/portal' };
  }
  return null;
}

export async function login(_prevState, formData) {
  const email = String(formData.get('email') || '').trim().toLowerCase();
  const password = String(formData.get('password') || '');
  if (!email || !password) return { error: 'Enter your email and password.' };

  const account = await findAccount(email, password);
  if (!account) return { error: 'That email and password do not match an account.' };

  cookies().set(SESSION_COOKIE, await signSession(account.session), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  });
  redirect(account.home);
}

export async function logout() {
  cookies().delete(SESSION_COOKIE);
  redirect('/login');
}
