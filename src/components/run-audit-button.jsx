'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LoaderCircle, Play } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

export function RunAuditButton({ clientId, label = 'Run audit', variant = 'default', size = 'default', className }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function run() {
    setPending(true);
    try {
      const res = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ clientId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not queue the audit');
      toast.success('Audit queued', { description: 'The worker will start it in a moment.' });
      router.push(`/admin/audits/${data.auditId}`);
    } catch (err) {
      toast.error(err.message);
      setPending(false);
    }
  }

  return (
    <Button onClick={run} disabled={pending} variant={variant} size={size} className={className}>
      {pending ? <LoaderCircle className="size-4 animate-spin" /> : <Play className="size-4" />}
      {label}
    </Button>
  );
}
