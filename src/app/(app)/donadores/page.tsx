import { prisma } from '@/lib/prisma';
import { formatMoney, currentPeriod } from '@/lib/money';
import Link from 'next/link';
import { marcarMensualidad, crearMensualidadesDelMes } from './actions';

export const dynamic = 'force-dynamic';

export default async function DonadoresPage({ searchParams }: { searchParams: Promise<{ periodo?: string }> }) {
  const { periodo: paramPeriodo } = await searchParams;
  const periodo = paramPeriodo || currentPeriod();
  const donadores = await prisma.donador.findMany({
    where: { activo: true },
    orderBy: { nombre: 'asc' },
    include: { mensualidades: { where: { periodo } } },
  });

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold">Donadores</h1>
          <p className="text-sm text-gray-400">{periodo}</p>
        </div>
        <div className="flex gap-2">
          <form action={crearMensualidadesDelMes}>
            <input type="hidden" name="periodo" value={periodo} />
            <button className="btn-ghost text-xs">Generar mes</button>
          </form>
          <Link href="/donadores/nuevo" className="btn-primary text-sm">+ Nuevo</Link>
        </div>
      </header>

      <ul className="space-y-2">
        {donadores.map((d) => {
          const m = d.mensualidades[0];
          const cobrado = m?.montoCobrado || 0;
          const esperado = m?.montoEsperado || d.montoMensual;
          const estado = m?.estado || 'sin-mes';
          return (
            <li key={d.id} className="card flex items-center justify-between gap-3">
              <Link href={`/donadores/${d.id}`} className="flex-1 min-w-0">
                <p className="font-medium truncate">{d.nombre}</p>
                <p className="text-xs text-gray-400">{formatMoney(cobrado)} / {formatMoney(esperado)}</p>
              </Link>
              <div className="flex items-center gap-2 shrink-0">
                <Chip estado={estado} />
                {estado !== 'cobrada' && m && (
                  <form action={marcarMensualidad}>
                    <input type="hidden" name="mensualidadId" value={m.id} />
                    <button className="btn-primary text-xs">Cobrar</button>
                  </form>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      {donadores.length === 0 && (
        <div className="card text-center text-gray-400">Aún no hay donadores. Creá uno o importá del Sheet.</div>
      )}
    </div>
  );
}

function Chip({ estado }: { estado: string }) {
  if (estado === 'cobrada') return <span className="chip-ok">Cobrada</span>;
  if (estado === 'parcial') return <span className="chip-warn">Parcial</span>;
  if (estado === 'sin-mes') return <span className="chip bg-border text-gray-400">Sin mes</span>;
  return <span className="chip-bad">Pendiente</span>;
}
