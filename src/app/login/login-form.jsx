'use client';

import { useRef, useState } from 'react';
import { flushSync, useFormState, useFormStatus } from 'react-dom';
import { Building2, Eye, EyeOff, LoaderCircle, LockKeyhole, Mail, UserRound } from 'lucide-react';
import { login } from './actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="h-10 w-full" disabled={pending}>
      {pending && <LoaderCircle className="size-4 animate-spin" />}
      Sign in
    </Button>
  );
}

function DemoTile({ icon: Icon, title, description, onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="group flex items-start gap-3 rounded-lg border bg-background p-3 text-left transition-colors hover:border-primary/40 hover:bg-accent disabled:pointer-events-none disabled:opacity-50"
    >
      <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-card text-muted-foreground ring-1 ring-border group-hover:text-primary">
        <Icon className="size-4" />
      </span>
      <span>
        <span className="block text-sm font-medium">{title}</span>
        <span className="block text-xs leading-snug text-muted-foreground">{description}</span>
      </span>
    </button>
  );
}

export function LoginForm({ demo }) {
  const formRef = useRef(null);
  const [state, action] = useFormState(login, {});
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const signInAs = (account) => {
    flushSync(() => {
      setEmail(account.email);
      setPassword(account.password);
    });
    formRef.current.requestSubmit();
  };

  return (
    <form ref={formRef} action={action} className="grid gap-5">
      <div className="grid gap-1.5">
        <Label htmlFor="email">Email</Label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            className="h-10 pl-9"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            className="h-10 px-9"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            className="absolute right-1 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:text-foreground"
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
      </div>
      {state?.error && <p className="rounded-md bg-poor/10 px-3 py-2 text-sm text-poor">{state.error}</p>}
      <SubmitButton />

      {demo && (
        <div className="grid gap-3">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            or explore with a demo account
            <span className="h-px flex-1 bg-border" />
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <DemoTile
              icon={Building2}
              title="Agency admin"
              description="Manage clients and run audits"
              onClick={() => signInAs(demo.admin)}
            />
            <DemoTile
              icon={UserRound}
              title="Client portal"
              description="View a client's report"
              onClick={() => signInAs(demo.client)}
              disabled={!demo.client}
            />
          </div>
        </div>
      )}
    </form>
  );
}
