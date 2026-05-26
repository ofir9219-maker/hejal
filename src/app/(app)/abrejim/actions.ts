'use server';

import { prisma } from '@/lib/prisma';
import { requireSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { parseMoney, currentPeriod } from '@/lib/money';

export async function crearAbrej(formData: FormData) {
  await requireSession();
  const nombre = String(formData.get('nombre') || '').trim();
  const contacto = String(formData.get('contacto') || '').trim() || null;
  const nominaMensual = parseMoney(String(formData.get('nominaMensual') || '0'));
  if (!nombre) return;
  await prisma.abrej.create({ data: { nombre, contacto, nominaMensual } });
  revalidatePath('/abrejim');
  redirect('/abrejim');
}

export async function actualizarAbrej(formData: FormData) {
  await requireSession();
  const id = String(formData.get('id'));
  const nombre = String(formData.get('nombre') || '').trim();
  const contacto = String(formData.get('contacto') || '').trim() || null;
  const nominaMensual = parseMoney(String(formData.get('nominaMensual') || '0'));
  const activo = formData.get('activo') === 'on';
  await prisma.abrej.update({ where: { id }, data: { nombre, contacto, nominaMensual, activo } });
  revalidatePath('/abrejim');
  redirect(`/abrejim/${id}`);
}

export async function generarNominasDelMes(formData: FormData) {
  await requireSession();
  const periodo = String(formData.get('periodo') || currentPeriod());
  const abrejim = await prisma.abrej.findMany({ where: { activo: true } });
  for (const a of abrejim) {
    await prisma.nominaPagada.upsert({
      where: { abrejId_periodo: { abrejId: a.id, periodo } },
      update: {},
      create: { abrejId: a.id, periodo, monto: a.nominaMensual },
    });
  }
  revalidatePath('/abrejim');
}

export async function marcarNominaPagada(formData: FormData) {
  await requireSession();
  const id = String(formData.get('nominaId'));
  const n = await prisma.nominaPagada.findUnique({ where: { id }, include: { abrej: true } });
  if (!n) return;
  await prisma.$transaction(async (tx) => {
    await tx.nominaPagada.update({
      where: { id },
      data: { estado: 'pagada', fechaPago: new Date() },
    });
    await tx.movimiento.create({
      data: {
        fecha: new Date(),
        tipo: 'egreso',
        categoria: 'nomina',
        monto: n.monto,
        descripcion: `Nómina ${n.periodo} — ${n.abrej.nombre}`,
        abrejId: n.abrejId,
      },
    });
  });
  revalidatePath('/abrejim');
  revalidatePath('/dashboard');
  revalidatePath('/caja');
}
