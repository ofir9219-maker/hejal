import { prisma } from '@/lib/prisma';
import { formatMoney, currentPeriod, formatPeriod } from '@/lib/money';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ periodo?: string }> }) {
  const { periodo: paramPeriodo } = await searchParams;
  const periodo = paramPeriodo || currentPeriod();

  const [mensualidades, nominas, movimientos] = await Promise.all([
    prisma.mensualidad.findMany({ where: { periodo }, include: { donador: true } }),
    prisma.nominaPagada.findMany({ where: { periodo }, include: { abrej: true } }),
    prisma.movimiento.findMany({
      where: { fecha: { gte: new Date(`${periodo}-01`), lt: nextMonth(periodo) } },
    }),
  ]);

  const totalEsperado = mensualidades.reduce((s, m) => s + m.montoEsperado, 0);
  const totalCobrado = mensualidades.reduce((s, m) => s + m.montoCobrado, 0);
  const totalNominas = nominas.reduce((s, n) => s + n.monto, 0);
  const nominasPagadas = nominas.filter((n) => n.estado === 'pagada').length;
  const nominasPendientes = nominas.length - nominasPagadas;
  const ingresos = movimientos.filter((m) => m.tipo === 'ingreso').reduce((s, m) => s + m.monto, 0);
  const egresos = movimientos.filter((m) => m.tipo === 'egreso').reduce((s, m) => s + m.monto, 0);
  const saldo = ingresos - egresos;
  const pendientes = mensualidades.filter((m) => m.estado !== 'cobrada');
  const cobertura = totalNominas > 0 ? Math.round((totalCobrado / totalNominas) * 100) : 0;

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-gray-400">{formatPeriod(periodo)}</p>
        </div>
      </header>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi label="Saldo" value={formatMoney(saldo)} tone={saldo >= 0 ? 'ok' : 'bad'} />
        <Kpi label="Ingresos" value={formatMoney(ingresos)} />
        <Kpi label="Egresos" value={formatMoney(egresos)} />
        <Kpi label="Movimientos" value={String(movimientos.length)} />
      </section>

      <section className="grid md:grid-cols-2 gap-3">
        <div className="card">
          <h2 className="font-semibold mb-3">Donadores</h2>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <Stat label="Total" value={String(mensualidades.length)} />
            <Stat label="Cobradas" value={String(mensualidades.filter((m) => m.estado === 'cobrada').length)} />
            <Stat label="Meta" value={formatMoney(totalEsperado)} />
            <Stat label="Cobrado" value={formatMoney(totalCobrado)} />
          </div>
          <div className="mt-3 h-2 bg-border rounded-full overflow-hidden">
            <div className="h-full bg-accent" style={{ width: `${totalEsperado ? Math.min(100, (totalCobrado / totalEsperado) * 100) : 0}%` }} />
          </div>
          <p className="text-xs text-gray-400 mt-1">{totalEsperado ? Math.round((totalCobrado / totalEsperado) * 100) : 0}% cobrado</p>
        </div>

        <div className="card">
          <h2 className="font-semibold mb-3">Nóminas Abrejim</h2>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <Stat label="Total" value={String(nominas.length)} />
            <Stat label="Pagadas" value={String(nominasPagadas)} />
            <Stat label="Pendientes" value={String(nominasPendientes)} />
            <Stat label="Monto mes" value={formatMoney(totalNominas)} />
          </div>
        </div>
      </section>

      <section className="card">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold">Cobertura nóminas</h2>
          <span className={cobertura >= 100 ? 'chip-ok' : cobertura >= 70 ? 'chip-warn' : 'chip-bad'}>
            {cobertura}%
          </span>
        </div>
        <p className="text-sm text-gray-400">
          Cobrado <b className="text-gray-200">{formatMoney(totalCobrado)}</b> de nómina total{' '}
          <b className="text-gray-200">{formatMoney(totalNominas)}</b>.{' '}
          {totalNominas - totalCobrado > 0 && (
            <>Faltan <b className="text-warning">{formatMoney(totalNominas - totalCobrado)}</b>.</>
          )}
        </p>
      </section>

      {pendientes.length > 0 && (
        <section className="card">
          <h2 className="font-semibold mb-3">Donadores pendientes ({pendientes.length})</h2>
          <ul className="divide-y divide-border">
            {pendientes.map((m) => (
              <li key={m.id} className="py-2 flex items-center justify-between">
                <Link href={`/donadores/${m.donadorId}`} className="text-sm hover:underline">
                  {m.donador.nombre}
                </Link>
                <span className="text-sm text-warning">
                  {formatMoney(m.montoEsperado - m.montoCobrado)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function Kpi({ label, value, tone }: { label: string; value: string; tone?: 'ok' | 'bad' }) {
  return (
    <div className="card">
      <p className="label">{label}</p>
      <p className={`text-xl font-bold ${tone === 'bad' ? 'text-danger' : tone === 'ok' ? 'text-success' : 'text-gray-100'}`}>
        {value}
      </p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-400">{label}</p>
      <p className="font-semibold">{value}</p>
    </div>
  );
}

function nextMonth(periodo: string): Date {
  const [y, m] = periodo.split('-').map(Number);
  return new Date(m === 12 ? y + 1 : y, m === 12 ? 0 : m, 1);
}
