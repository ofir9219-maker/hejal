'use server';

import { prisma } from '@/lib/prisma';
import { requireSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { parseMoney, currentPeriod } from '@/lib/money';

export async function crearDonador(formData: FormData) {
  await requireSession();
  const nombre = String(formData.get('nombre') || '').trim();
  const contacto = String(formData.get('contacto') || '').trim() || null;
  const montoMensual = parseMoney(String(formData.get('montoMensual') || '0'));
  if (!nombre) return;
  await prisma.donador.create({ data: { nombre, contacto, montoMensual } });
  revalidatePath('/donadores');
  redirect('/donadores');
}

export async function actualizarDonador(formData: FormData) {
  await requireSession();
  const id = String(formData.get('id'));
  const nombre = String(formData.get('nombre') || '').trim();
  const contacto = String(formData.get('contacto') || '').trim() || null;
  const montoMensual = parseMoney(String(formData.get('montoMensual') || '0'));
  const activo = formData.get('activo') === 'on';
  await prisma.donador.update({ where: { id }, data: { nombre, contacto, montoMensual, activo } });
  revalidatePath('/donadores');
  redirect(`/donadores/${id}`);
}

export async function crearMensualidadesDelMes(formData: FormData) {
  await requireSession();
  const periodo = String(formData.get('periodo') || currentPeriod());
  const donadores = await prisma.donador.findMany({ where: { activo: true } });
  for (const d of donadores) {
    await prisma.mensualidad.upsert({
      where: { donadorId_periodo: { donadorId: d.id, periodo } },
      update: {},
      create: { donadorId: d.id, periodo, montoEsperado: d.montoMensual },
    });
  }
  revalidatePath('/donadores');
}

export async function marcarMensualidad(formData: FormData) {
  await requireSession();
  const id = String(formData.get('mensualidadId'));
  const monto = formData.get('monto') ? parseMoney(String(formData.get('monto'))) : null;
  const m = await prisma.mensualidad.findUnique({ where: { id }, include: { donador: true } });
  if (!m) return;
  const montoCobrado = monto ?? m.montoEsperado;
  const estado = montoCobrado >= m.montoEsperado ? 'cobrada' : montoCobrado > 0 ? 'parcial' : 'pendiente';
  await prisma.$transaction(async (tx) => {
    await tx.mensualidad.update({
      where: { id },
      data: { montoCobrado, estado, fechaCobro: new Date() },
    });
    if (montoCobrado > 0) {
      await tx.movimiento.create({
        data: {
          fecha: new Date(),
          tipo: 'ingreso',
          categoria: 'mensualidad',
          monto: montoCobrado,
          descripcion: `Mensualidad ${m.periodo} — ${m.donador.nombre}`,
          donadorId: m.donadorId,
        },
      });
    }
  });
  revalidatePath('/donadores');
  revalidatePath('/dashboard');
  revalidatePath('/caja');
}
