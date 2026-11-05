'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  CircleAlert,
  Download,
  ExternalLink,
  History,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Menu,
  Search,
  UserRound,
  Zap,
} from 'lucide-react';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { logout } from '@/app/login/actions';
import { hostname } from '@/lib/format';
import { cn } from '@/lib/utils';

const NAV = [
  { href: '/portal', label: 'Overview', icon: LayoutDashboard },
  { href: '/portal/fix-first', label: 'Fix first', icon: CircleAlert, count: 'fixFirst', urgent: true },
  { href: '/portal/quick-wins', label: 'Quick wins', icon: Zap, count: 'quickWins' },
  { href: '/portal/recommendations', label: 'Recommendations', icon: ListChecks, count: 'recommendations' },
  { href: '/portal/search', label: 'Search performance', icon: Search },
  { href: '/portal/reports', label: 'Past reports', icon: History, count: 'reports', also: '/portal/audits' },
];

function PortalTitle() {
  return (
    <>
      <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/15">
        <UserRound className="size-4 text-white" />
      </span>
      <span className="text-lg font-bold uppercase text-white">Client portal</span>
    </>
  );
}

function isActive(pathname, item) {
  if (item.href === '/portal') return pathname === '/portal';
  return pathname.startsWith(item.href) || (item.also && pathname.startsWith(item.also));
}

function NavLinks({ counts, onNavigate }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1.5">
      {NAV.map((item) => {
        const active = isActive(pathname, item);
        const count = item.count ? counts[item.count] : null;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              'flex h-10 items-center gap-3 rounded-lg px-3 text-sm transition-colors',
              active
                ? 'bg-white/10 font-medium text-white'
                : 'bg-white/[0.03] text-white/70 hover:bg-white/[0.06] hover:text-white',
            )}
          >
            <item.icon className={cn('size-4', active ? 'text-white' : 'text-white/50')} />
            {item.label}
            {count > 0 && (
              <span
                className={cn(
                  'tabular ml-auto min-w-6 rounded-md px-1.5 py-0.5 text-center text-xs font-medium',
                  item.urgent ? 'bg-poor/90 text-white' : 'bg-white/10 text-white/80',
                )}
              >
                {count}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

function Account({ client }) {
  return (
    <div className="flex items-center gap-3 border-t border-white/10 pt-4">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm font-semibold">
        {client.name.charAt(0)}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{client.name}</p>
        <p className="truncate text-xs text-white/55">{client.email}</p>
      </div>
      <form action={logout}>
        <button
          type="submit"
          aria-label="Sign out"
          className="flex size-9 items-center justify-center rounded-lg text-white/60 transition-colors hover:bg-white/10 hover:text-white"
        >
          <LogOut className="size-4" />
        </button>
      </form>
    </div>
  );
}

export function PortalShell({ client, counts, latestPdf, children }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-dvh text-shell-foreground lg:grid lg:h-dvh lg:grid-cols-[17rem_minmax(0,1fr)] lg:overflow-hidden">
      <aside className="hidden flex-col overflow-y-auto bg-shell lg:flex">
        <div className="relative flex h-16 shrink-0 items-center gap-2.5 px-5">
          <PortalTitle />
          <span className="absolute inset-x-5 bottom-0 h-px bg-white/10" />
        </div>
        <div className="flex flex-1 flex-col px-4 pb-5 pt-4">
          <div className="flex-1">
            <NavLinks counts={counts} />
          </div>
          <Account client={client} />
        </div>
      </aside>

      <div className="flex min-w-0 flex-col lg:h-dvh">
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between gap-4 bg-shell-top px-4 sm:px-6 lg:static lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <button
                  aria-label="Open menu"
                  className="-ml-2 flex size-9 items-center justify-center rounded-lg text-white/80 hover:bg-white/10 lg:hidden"
                >
                  <Menu className="size-5" />
                </button>
              </SheetTrigger>
              <SheetContent
                side="left"
                aria-describedby={undefined}
                className="flex w-72 flex-col border-none bg-shell px-4 py-5 text-shell-foreground"
              >
                <SheetTitle className="relative -mx-4 -mt-5 flex h-16 items-center gap-2.5 px-5">
                  <PortalTitle />
                  <span className="absolute inset-x-5 bottom-0 h-px bg-white/10" />
                </SheetTitle>
                <div className="mt-4 flex-1">
                  <NavLinks counts={counts} onNavigate={() => setOpen(false)} />
                </div>
                <Account client={client} />
              </SheetContent>
            </Sheet>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{client.name}</p>
              <a
                href={client.websiteUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 truncate text-xs text-white/55 hover:text-white"
              >
                {hostname(client.websiteUrl)}
                <ExternalLink className="size-3 shrink-0" />
              </a>
            </div>
          </div>
          {latestPdf && (
            <a
              href={`/api/audit/${latestPdf}/pdf`}
              className="flex h-9 shrink-0 items-center gap-2 rounded-lg bg-white px-3 text-sm font-medium text-shell transition-colors hover:bg-white/90"
            >
              <Download className="size-4" />
              <span className="hidden sm:inline">Download latest PDF</span>
              <span className="sm:hidden">PDF</span>
            </a>
          )}
        </header>

        <main className="flex-1 bg-background text-foreground lg:overflow-y-auto">
          <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-10 lg:py-10">{children}</div>
        </main>
      </div>
    </div>
  );
}
