import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4 text-center">
      <p className="tabular text-6xl font-semibold tracking-tight text-muted-foreground/50">404</p>
      <h1 className="mt-4 text-xl font-semibold">This page does not exist</h1>
      <p className="mt-1 text-sm text-muted-foreground">It may have been deleted, or the link is wrong.</p>
      <Button asChild className="mt-6">
        <Link href="/">Go to the dashboard</Link>
      </Button>
    </div>
  );
}
