import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { actualizarAbrej } from '../actions';
import { formatMoney, formatPeriod } from '@/lib/money';

export const dynamic = 'force-dynamic';

export default async function AbrejPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const a = await prisma.abrej.findUnique({
    where: { id },
    include: { nominas: { orderBy: { periodo: 'desc' }, take: 12 } },
  });
  if (!a) notFound();

  return (
    <div className="space-y-4">
      <Link href="/abrejim" className="text-sm text-gray-400">← Volver</Link>
      <h1 className="text-2xl font-bold">{a.nombre}</h1>

      <form action={actualizarAbrej} className="card space-y-3">
        <input type="hidden" name="id" value={a.id} />
        <div><label className="label">Nombre</label><input name="nombre" className="input" defaultValue={a.nombre} required /></div>
        <div><label className="label">Contacto</label><input name="contacto" className="input" defaultValue={a.contacto || ''} /></div>
        <div><label className="label">Nómina mensual</label><input name="nominaMensual" className="input" inputMode="numeric" defaultValue={a.nominaMensual} /></div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="activo" defaultChecked={a.activo} /> Activo</label>
        <button className="btn-primary">Guardar</button>
      </form>

      <section className="card">
        <h2 className="font-semibold mb-2">Nóminas</h2>
        <ul className="divide-y divide-border text-sm">
          {a.nominas.map((n) => (
            <li key={n.id} className="py-2 flex justify-between">
              <span>{formatPeriod(n.periodo)}</span>
              <span className="text-gray-400">{formatMoney(n.monto)} <b className={n.estado === 'pagada' ? 'text-success' : 'text-warning'}>{n.estado}</b></span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
