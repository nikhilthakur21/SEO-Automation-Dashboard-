import { redirect } from 'next/navigation';
import { ScoreScale } from '@/components/score';
import { getSession } from '@/lib/auth';
import { LoginForm } from './login-form';

export const metadata = { title: 'Sign in' };

function demoAccounts() {
  if (process.env.DEMO_MODE !== 'true') return null;
  return {
    admin: { email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD },
    client: process.env.DEMO_CLIENT_EMAIL
      ? { email: process.env.DEMO_CLIENT_EMAIL, password: process.env.CLIENT_PASSWORD }
      : null,
  };
}

export default async function LoginPage() {
  const session = await getSession();
  if (session?.role === 'admin') redirect('/admin');
  if (session?.role === 'client') redirect('/portal');

  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:bg-card">
      <aside className="hidden flex-col justify-center p-10 lg:flex xl:p-14">
        <div className="max-w-md">
          <p className="text-3xl font-semibold leading-tight tracking-tight">
            Automated SEO audits that turn website data into prioritised, measurable fixes.
          </p>
          <div className="mt-10 rounded-lg border bg-background p-6">
            <p className="mb-4 text-sm text-muted-foreground">Smile Studio Dental, October report</p>
            <ScoreScale score={72} />
          </div>
          <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
            Every site is crawled, checked against Search Console and PageSpeed data, and analysed by Claude. Clients get a PDF on
            WhatsApp and email with fixes ranked by impact.
          </p>
        </div>
      </aside>

      <main className="relative flex items-center overflow-hidden bg-background px-4 py-10 sm:px-6 lg:rounded-l-[2rem] lg:border-l">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(hsl(var(--border))_1px,transparent_1px)] [background-size:22px_22px] [mask-image:radial-gradient(ellipse_at_center,black_35%,transparent_80%)]"
        />
        <div className="relative mx-auto w-full max-w-md">
          <div className="rounded-xl border bg-card p-6 shadow-[0_1px_2px_hsl(var(--foreground)/0.04),0_12px_32px_-12px_hsl(var(--foreground)/0.12)] sm:p-8">
            <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
            <p className="mb-7 mt-1 text-sm text-muted-foreground">Sign in to manage audits or view your website report.</p>
            <LoginForm demo={demoAccounts()} />
          </div>
          <p className="mt-6 text-center text-xs text-muted-foreground">Need access? Ask your account manager for an invite.</p>
        </div>
      </main>
    </div>
  );
}
