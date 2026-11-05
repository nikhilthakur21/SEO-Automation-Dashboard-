'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function AutoRefresh({ active, interval = 3000 }) {
  const router = useRouter();

  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => router.refresh(), interval);
    return () => clearInterval(id);
  }, [active, interval, router]);

  return null;
}
