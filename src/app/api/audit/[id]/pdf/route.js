import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession, canViewAudit } from '@/lib/auth';
import { getReportUrl, readLocalReport } from '@/lib/storage';

export const dynamic = 'force-dynamic';

export async function GET(_req, { params }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const audit = await prisma.audit.findUnique({
    where: { id: params.id },
    select: { id: true, clientId: true, pdfPath: true, createdAt: true, client: { select: { name: true } } },
  });
  if (!audit || !canViewAudit(session, audit) || !audit.pdfPath) {
    return NextResponse.json({ error: 'Report not found' }, { status: 404 });
  }

  const slug = audit.client.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const filename = `${slug}-seo-audit-${audit.createdAt.toISOString().slice(0, 10)}.pdf`;

  const signedUrl = await getReportUrl(audit.id, { filename });
  if (signedUrl) return NextResponse.redirect(signedUrl);

  const file = await readLocalReport(audit.id);
  if (!file) return NextResponse.json({ error: 'Report file is not available on this server' }, { status: 404 });

  return new NextResponse(file, {
    headers: {
      'content-type': 'application/pdf',
      'content-disposition': `attachment; filename="${filename}"`,
    },
  });
}
