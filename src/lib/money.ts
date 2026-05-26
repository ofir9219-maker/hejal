export function formatMoney(cents: number): string {
  const n = (cents ?? 0).toLocaleString('es-AR');
  return `$${n}`;
}

export function parseMoney(input: string): number {
  if (!input) return 0;
  const cleaned = input.replace(/[^\d.-]/g, '');
  const n = Number(cleaned);
  return Number.isFinite(n) ? Math.round(n) : 0;
}

export function currentPeriod(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function formatPeriod(periodo: string): string {
  const [y, m] = periodo.split('-');
  const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  return `${meses[Number(m) - 1]} ${y}`;
}
