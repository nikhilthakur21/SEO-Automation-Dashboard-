import Link from 'next/link';
import { cn } from '@/lib/utils';

export function BrandMark({ className }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={cn('size-7', className)}>
      <rect width="32" height="32" rx="8" className="fill-primary" />
      <g className="stroke-primary-foreground" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="14" cy="14" r="7" strokeWidth="2.5" />
        <path d="M19.3 19.3 25 25" strokeWidth="3" />
        <path d="M10.5 16.5 13 14l2 2 3-3.5" strokeWidth="1.8" />
      </g>
    </svg>
  );
}

export function Brand({ href = '/', className }) {
  return (
    <Link href={href} className={cn('flex items-center gap-2.5 font-semibold tracking-tight', className)}>
      <BrandMark />
      <span>Edgelink SEO</span>
    </Link>
  );
}
