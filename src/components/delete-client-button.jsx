'use client';

import { useState, useTransition } from 'react';
import { LoaderCircle, Trash2 } from 'lucide-react';
import { deleteClient } from '@/app/admin/clients/actions';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export function DeleteClientButton({ clientId, name }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Delete client">
          <Trash2 className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete {name}?</DialogTitle>
          <DialogDescription>
            This removes the client and all of its audits and delivery records. It cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Keep client
          </Button>
          <Button variant="destructive" disabled={pending} onClick={() => startTransition(() => deleteClient(clientId))}>
            {pending && <LoaderCircle className="size-4 animate-spin" />}
            Delete client
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
