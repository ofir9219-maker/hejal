import { prisma } from '@/lib/prisma';
import { formatMoney } from '@/lib/money';
import Link from 'next/link';
import { eliminarMovimiento } from './actions';

export const dynamic = 'force-dynamic';

export default async function CajaPage() {
  const movimientos = await prisma.movimiento.findMany({
    orderBy: { fecha: 'desc' },
    take: 100,
    include: { donador: true, abrej: true },
  });

  const totalIngresos = movimientos.filter((m) => m.tipo === 'ingreso').reduce((s, m) => s + m.monto, 0);
  const totalEgresos = movimientos.filter((m) => m.tipo === 'egreso').reduce((s, m) => s + m.monto, 0);

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Caja</h1>
        <Link href="/caja/nuevo" className="btn-primary text-sm">+ Movimiento</Link>
      </header>

      <section className="grid grid-cols-3 gap-3">
        <div className="card"><p className="label">Ingresos</p><p className="font-bold text-success">{formatMoney(totalIngresos)}</p></div>
        <div className="card"><p className="label">Egresos</p><p className="font-bold text-danger">{formatMoney(totalEgresos)}</p></div>
        <div className="card"><p className="label">Saldo</p><p className="font-bold">{formatMoney(totalIngresos - totalEgresos)}</p></div>
      </section>

      <ul className="space-y-2">
        {movimientos.map((m) => (
          <li key={m.id} className="card flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-400">{m.fecha.toLocaleDateString('es-AR')} · {m.categoria}</p>
              <p className="text-sm truncate">{m.descripcion || (m.donador?.nombre ?? m.abrej?.nombre ?? '—')}</p>
            </div>
            <div className="text-right shrink-0">
              <p className={`font-bold ${m.tipo === 'ingreso' ? 'text-success' : 'text-danger'}`}>
                {m.tipo === 'ingreso' ? '+' : '−'}{formatMoney(m.monto)}
              </p>
              <form action={eliminarMovimiento}>
                <input type="hidden" name="id" value={m.id} />
                <button className="text-xs text-gray-400 hover:text-danger">eliminar</button>
              </form>
            </div>
          </li>
        ))}
      </ul>

      {movimientos.length === 0 && (
        <div className="card text-center text-gray-400">Sin movimientos aún.</div>
      )}
    </div>
  );
}
