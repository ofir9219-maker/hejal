import { prisma } from '@/lib/prisma';
import { formatMoney, currentPeriod } from '@/lib/money';
import Link from 'next/link';
import { generarNominasDelMes, marcarNominaPagada } from './actions';

export const dynamic = 'force-dynamic';

export default async function AbrejimPage({ searchParams }: { searchParams: Promise<{ periodo?: string }> }) {
  const { periodo: paramPeriodo } = await searchParams;
  const periodo = paramPeriodo || currentPeriod();
  const abrejim = await prisma.abrej.findMany({
    where: { activo: true },
    orderBy: { nombre: 'asc' },
    include: { nominas: { where: { periodo } } },
  });

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold">Abrejim</h1>
          <p className="text-sm text-gray-400">{periodo}</p>
        </div>
        <div className="flex gap-2">
          <form action={generarNominasDelMes}>
            <input type="hidden" name="periodo" value={periodo} />
            <button className="btn-ghost text-xs">Generar mes</button>
          </form>
          <Link href="/abrejim/nuevo" className="btn-primary text-sm">+ Nuevo</Link>
        </div>
      </header>

      <ul className="space-y-2">
        {abrejim.map((a) => {
          const n = a.nominas[0];
          return (
            <li key={a.id} className="card flex items-center justify-between gap-3">
              <Link href={`/abrejim/${a.id}`} className="flex-1 min-w-0">
                <p className="font-medium truncate">{a.nombre}</p>
                <p className="text-xs text-gray-400">{formatMoney(n?.monto || a.nominaMensual)}</p>
              </Link>
              <div className="flex items-center gap-2 shrink-0">
                {n?.estado === 'pagada' ? (
                  <span className="chip-ok">Pagada</span>
                ) : n ? (
                  <form action={marcarNominaPagada}>
                    <input type="hidden" name="nominaId" value={n.id} />
                    <button className="btn-primary text-xs">Pagar</button>
                  </form>
                ) : (
                  <span className="chip bg-border text-gray-400">Sin mes</span>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      {abrejim.length === 0 && (
        <div className="card text-center text-gray-400">Aún no hay abrejim cargados.</div>
      )}
    </div>
  );
}
