import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { queueAudit } from '@/lib/audits';
import { getSession } from '@/lib/auth';

export async function POST(req) {
  const session = await getSession();
  if (session?.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { clientId } = await req.json().catch(() => ({}));
  if (!clientId) return NextResponse.json({ error: 'clientId required' }, { status: 400 });

  const client = await prisma.client.findUnique({ where: { id: clientId }, select: { id: true } });
  if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 });

  try {
    const audit = await queueAudit(clientId, 'manual');
    return NextResponse.json({ auditId: audit.id }, { status: 202 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 503 });
  }
}
