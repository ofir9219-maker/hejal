'use server';

import { prisma } from '@/lib/prisma';
import { requireSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { parseMoney } from '@/lib/money';

export async function crearMovimiento(formData: FormData) {
  await requireSession();
  const tipo = String(formData.get('tipo') || 'ingreso');
  const categoria = String(formData.get('categoria') || 'otro');
  const monto = parseMoney(String(formData.get('monto') || '0'));
  const descripcion = String(formData.get('descripcion') || '') || null;
  const fechaRaw = String(formData.get('fecha') || '');
  const fecha = fechaRaw ? new Date(fechaRaw) : new Date();
  if (monto <= 0) return;
  await prisma.movimiento.create({ data: { tipo, categoria, monto, descripcion, fecha } });
  revalidatePath('/caja');
  revalidatePath('/dashboard');
  redirect('/caja');
}

export async function eliminarMovimiento(formData: FormData) {
  await requireSession();
  const id = String(formData.get('id'));
  await prisma.movimiento.delete({ where: { id } });
  revalidatePath('/caja');
  revalidatePath('/dashboard');
}
