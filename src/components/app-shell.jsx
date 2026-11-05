'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Building2,
  CircleAlert,
  Download,
  ExternalLink,
  History,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Menu,
  Play,
  Search,
  UserRound,
  Zap,
} from 'lucide-react';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { logout } from '@/app/login/actions';
import { cn } from '@/lib/utils';

const VARIANTS = {
  admin: {
    heading: 'Agency admin',
    icon: Building2,
    width: 'max-w-6xl',
    nav: [
      { href: '/admin', label: 'Overview', icon: LayoutDashboard },
      { href: '/admin/clients', label: 'Clients', icon: Building2, count: 'clients' },
      { href: '/admin/audits', label: 'Audits', icon: ListChecks, count: 'active', tone: 'live' },
    ],
  },
  client: {
    heading: 'Client portal',
    icon: UserRound,
    width: 'max-w-5xl',
    nav: [
      { href: '/portal', label: 'Overview', icon: LayoutDashboard },
      { href: '/portal/fix-first', label: 'Fix first', icon: CircleAlert, count: 'fixFirst', tone: 'urgent' },
      { href: '/portal/quick-wins', label: 'Quick wins', icon: Zap, count: 'quickWins' },
      { href: '/portal/recommendations', label: 'Recommendations', icon: ListChecks, count: 'recommendations' },
      { href: '/portal/search', label: 'Search performance', icon: Search },
      { href: '/portal/reports', label: 'Past reports', icon: History, count: 'reports', also: '/portal/audits' },
    ],
  },
};

const ACTION_ICONS = { download: Download, play: Play };

const COUNT_TONES = {
  urgent: 'bg-poor/90 text-white',
  live: 'bg-primary text-white',
};

function isActive(pathname, item, home) {
  if (item.href === home) return pathname === home;
  return pathname.startsWith(item.href) || (item.also && pathname.startsWith(item.also));
}

function Heading({ variant }) {
  const { heading, icon: Icon } = VARIANTS[variant];
  return (
    <>
      <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/15">
        <Icon className="size-4 text-white" />
      </span>
      <span className="text-lg font-bold uppercase text-white">{heading}</span>
      <span className="absolute inset-x-5 bottom-0 h-px bg-white/10" />
    </>
  );
}

function NavLinks({ variant, counts, onNavigate }) {
  const pathname = usePathname();
  const items = VARIANTS[variant].nav;
  return (
    <nav className="flex flex-col gap-1.5">
      {items.map((item) => {
        const active = isActive(pathname, item, items[0].href);
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
                  COUNT_TONES[item.tone] || 'bg-white/10 text-white/80',
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

function Account({ account }) {
  return (
    <div className="flex items-center gap-3 border-t border-white/10 pt-4">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm font-semibold">
        {account.name.charAt(0)}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{account.name}</p>
        <p className="truncate text-xs text-white/55">{account.email}</p>
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

function Sidebar({ variant, counts, account, onNavigate }) {
  return (
    <>
      <div className="relative flex h-16 shrink-0 items-center gap-2.5 px-5">
        <Heading variant={variant} />
      </div>
      <div className="flex flex-1 flex-col px-4 pb-5 pt-4">
        <div className="flex-1">
          <NavLinks variant={variant} counts={counts} onNavigate={onNavigate} />
        </div>
        <Account account={account} />
      </div>
    </>
  );
}

export function AppShell({ variant, counts = {}, account, topbar, action, children }) {
  const [open, setOpen] = useState(false);
  const ActionIcon = action ? ACTION_ICONS[action.icon] : null;
  const ActionTag = action?.external ? 'a' : Link;

  return (
    <div className="min-h-dvh text-shell-foreground lg:grid lg:h-dvh lg:grid-cols-[17rem_minmax(0,1fr)] lg:overflow-hidden">
      <aside className="hidden flex-col overflow-y-auto bg-shell lg:flex">
        <Sidebar variant={variant} counts={counts} account={account} />
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
                className="flex w-72 flex-col border-none bg-shell p-0 text-shell-foreground"
              >
                <SheetTitle className="sr-only">{VARIANTS[variant].heading}</SheetTitle>
                <Sidebar variant={variant} counts={counts} account={account} onNavigate={() => setOpen(false)} />
              </SheetContent>
            </Sheet>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{topbar.title}</p>
              {topbar.href ? (
                <a
                  href={topbar.href}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 truncate text-xs text-white/55 hover:text-white"
                >
                  {topbar.subtitle}
                  <ExternalLink className="size-3 shrink-0" />
                </a>
              ) : (
                <p className="truncate text-xs text-white/55">{topbar.subtitle}</p>
              )}
            </div>
          </div>
          {action && (
            <ActionTag
              href={action.href}
              className="flex h-9 shrink-0 items-center gap-2 rounded-lg bg-white px-3 text-sm font-medium text-shell transition-colors hover:bg-white/90"
            >
              {ActionIcon && <ActionIcon className="size-4" />}
              <span className="hidden sm:inline">{action.label}</span>
              <span className="sm:hidden">{action.short || action.label}</span>
            </ActionTag>
          )}
        </header>

        <main className="flex-1 bg-background text-foreground lg:overflow-y-auto">
          <div className={cn('mx-auto w-full px-4 py-8 sm:px-6 lg:px-10 lg:py-10', VARIANTS[variant].width)}>{children}</div>
        </main>
      </div>
    </div>
  );
}
