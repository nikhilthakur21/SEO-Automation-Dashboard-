'use client';

import { useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { LoaderCircle, Plus } from 'lucide-react';
import { createClient } from '@/app/admin/clients/actions';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const BUSINESS_TYPES = ['Dental clinic', 'Healthcare clinic', 'Hospital', 'Real estate', 'Local business'];

function Field({ id, label, error, hint, children }) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error ? <p className="text-xs text-poor">{error[0]}</p> : hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending && <LoaderCircle className="size-4 animate-spin" />}
      Add client
    </Button>
  );
}

export function AddClientDialog() {
  const [open, setOpen] = useState(false);
  const [state, action] = useFormState(createClient, {});
  const errors = state?.errors || {};

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" />
          Add client
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add a client</DialogTitle>
          <DialogDescription>Their site is audited now and then once a month.</DialogDescription>
        </DialogHeader>
        <form action={action} className="grid gap-4">
          <Field id="name" label="Business name" error={errors.name}>
            <Input id="name" name="name" placeholder="Smile Studio Dental" required />
          </Field>
          <Field id="websiteUrl" label="Website" error={errors.websiteUrl}>
            <Input id="websiteUrl" name="websiteUrl" type="url" placeholder="https://smilestudio.in" required />
          </Field>
          <Field id="businessType" label="Business type" error={errors.businessType}>
            <Select name="businessType" defaultValue="Dental clinic">
              <SelectTrigger id="businessType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BUSINESS_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="city" label="City" error={errors.city}>
              <Input id="city" name="city" placeholder="Pune" required />
            </Field>
            <Field id="state" label="State" error={errors.state}>
              <Input id="state" name="state" defaultValue="Maharashtra" required />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="whatsapp" label="WhatsApp number" error={errors.whatsapp} hint="Gets the PDF report">
              <Input id="whatsapp" name="whatsapp" type="tel" placeholder="+91 98765 43210" />
            </Field>
            <Field id="email" label="Email" error={errors.email} hint="Also the client portal login">
              <Input id="email" name="email" type="email" placeholder="owner@smilestudio.in" />
            </Field>
          </div>
          <label className="flex items-center gap-2.5 text-sm">
            <Checkbox name="runAudit" defaultChecked />
            Run the first audit right away
          </label>
          <DialogFooter className="mt-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <SubmitButton />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
