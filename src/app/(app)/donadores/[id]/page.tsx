import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { actualizarDonador } from '../actions';
import { formatMoney, formatPeriod } from '@/lib/money';

export const dynamic = 'force-dynamic';

export default async function DonadorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const d = await prisma.donador.findUnique({
    where: { id },
    include: { mensualidades: { orderBy: { periodo: 'desc' }, take: 12 } },
  });
  if (!d) notFound();

  return (
    <div className="space-y-4">
      <Link href="/donadores" className="text-sm text-gray-400">← Volver</Link>
      <h1 className="text-2xl font-bold">{d.nombre}</h1>

      <form action={actualizarDonador} className="card space-y-3">
        <input type="hidden" name="id" value={d.id} />
        <div><label className="label">Nombre</label><input name="nombre" className="input" defaultValue={d.nombre} required /></div>
        <div><label className="label">Contacto</label><input name="contacto" className="input" defaultValue={d.contacto || ''} /></div>
        <div><label className="label">Monto mensual</label><input name="montoMensual" className="input" inputMode="numeric" defaultValue={d.montoMensual} /></div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="activo" defaultChecked={d.activo} /> Activo</label>
        <button className="btn-primary">Guardar</button>
      </form>

      <section className="card">
        <h2 className="font-semibold mb-2">Mensualidades</h2>
        <ul className="divide-y divide-border text-sm">
          {d.mensualidades.map((m) => (
            <li key={m.id} className="py-2 flex justify-between">
              <span>{formatPeriod(m.periodo)}</span>
              <span className="text-gray-400">{formatMoney(m.montoCobrado)} / {formatMoney(m.montoEsperado)} <b className={m.estado === 'cobrada' ? 'text-success' : 'text-warning'}>{m.estado}</b></span>
            </li>
          ))}
        </ul>
        {d.mensualidades.length === 0 && <p className="text-sm text-gray-400">Sin mensualidades aún.</p>}
      </section>
    </div>
  );
}
