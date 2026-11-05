'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Building2, LayoutDashboard, ListChecks, LogOut, Menu } from 'lucide-react';
import { Brand } from '@/components/brand';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { logout } from '@/app/login/actions';
import { cn } from '@/lib/utils';

const NAV = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/clients', label: 'Clients', icon: Building2 },
  { href: '/admin/audits', label: 'Audits', icon: ListChecks },
];

function NavLinks({ onNavigate }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-0.5">
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = href === '/admin' ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={cn(
              'flex h-9 items-center gap-2.5 rounded-md px-2.5 text-sm transition-colors',
              active ? 'bg-secondary font-medium text-foreground' : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground',
            )}
          >
            <Icon className="size-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

function Account({ email }) {
  return (
    <div className="flex items-center justify-between gap-2 border-t pt-4">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">Admin</p>
        <p className="truncate text-xs text-muted-foreground">{email}</p>
      </div>
      <div className="flex shrink-0">
        <form action={logout}>
          <Button variant="ghost" size="icon" aria-label="Sign out" type="submit">
            <LogOut className="size-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}

export function AdminShell({ email, children }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[15rem_1fr]">
      <aside className="sticky top-0 hidden h-dvh flex-col justify-between border-r bg-card px-4 py-5 lg:flex">
        <div className="space-y-8">
          <Brand href="/admin" className="px-1" />
          <NavLinks />
        </div>
        <Account email={email} />
      </aside>

      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-card/90 px-4 backdrop-blur lg:hidden">
        <Brand href="/admin" />
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Open menu">
              <Menu className="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="flex w-72 flex-col justify-between" aria-describedby={undefined}>
            <div className="space-y-8">
              <SheetTitle asChild>
                <div>
                  <Brand href="/admin" />
                </div>
              </SheetTitle>
              <NavLinks onNavigate={() => setOpen(false)} />
            </div>
            <Account email={email} />
          </SheetContent>
        </Sheet>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-10 lg:py-10">{children}</main>
    </div>
  );
}
