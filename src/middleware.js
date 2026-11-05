import { NextResponse } from 'next/server';
import { SESSION_COOKIE, verifySession } from '@/lib/session';

export async function middleware(req) {
  const { pathname } = req.nextUrl;
  const session = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);
  const required = pathname.startsWith('/admin') ? 'admin' : 'client';

  if (session?.role === required) return NextResponse.next();

  if (session?.role) {
    return NextResponse.redirect(new URL(session.role === 'admin' ? '/admin' : '/portal', req.url));
  }
  return NextResponse.redirect(new URL('/login', req.url));
}

export const config = {
  matcher: ['/admin/:path*', '/portal/:path*'],
};
