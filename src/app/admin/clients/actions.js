'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { queueAudit } from '@/lib/audits';

const optional = z
  .string()
  .trim()
  .optional()
  .transform((v) => v || null);

const ClientInput = z.object({
  name: z.string().trim().min(2, 'Enter the business name'),
  websiteUrl: z
    .string()
    .trim()
    .url('Enter the full address, starting with https://')
    .refine((v) => /^https?:\/\//i.test(v), 'The address must start with http:// or https://'),
  businessType: z.string().trim().min(2, 'Choose a business type'),
  city: z.string().trim().min(2, 'Enter the city'),
  state: z.string().trim().min(2, 'Enter the state'),
  whatsapp: optional,
  email: optional.refine((v) => !v || z.string().email().safeParse(v).success, 'Enter a valid email address'),
});

export async function createClient(_prevState, formData) {
  await requireAdmin();
  const parsed = ClientInput.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors };

  const data = { ...parsed.data, websiteUrl: new URL(parsed.data.websiteUrl).href };
  let client;
  try {
    client = await prisma.client.create({ data });
  } catch (err) {
    if (err.code === 'P2002') return { errors: { websiteUrl: ['This website already belongs to a client'] } };
    throw err;
  }

  if (formData.get('runAudit') === 'on') await queueAudit(client.id, 'manual');
  revalidatePath('/admin/clients');
  redirect(`/admin/clients/${client.id}`);
}

export async function deleteClient(clientId) {
  await requireAdmin();
  await prisma.$transaction([
    prisma.notification.deleteMany({ where: { audit: { clientId } } }),
    prisma.audit.deleteMany({ where: { clientId } }),
    prisma.client.delete({ where: { id: clientId } }),
  ]);
  revalidatePath('/admin/clients');
  redirect('/admin/clients');
}
