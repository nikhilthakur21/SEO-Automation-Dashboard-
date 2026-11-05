import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession, canViewAudit } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(_req, { params }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const audit = await prisma.audit.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      clientId: true,
      status: true,
      progress: true,
      currentStep: true,
      overallScore: true,
      result: true,
      errorMessage: true,
      createdAt: true,
      completedAt: true,
    },
  });
  if (!audit || !canViewAudit(session, audit)) {
    return NextResponse.json({ error: 'Audit not found' }, { status: 404 });
  }

  return NextResponse.json(audit, { headers: { 'cache-control': 'no-store' } });
}
