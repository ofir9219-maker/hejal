import { PrismaClient } from '@prisma/client';
import { parse } from 'csv-parse/sync';

const prisma = new PrismaClient();

const SHEET_ID = process.env.SHEET_ID || '1fiy1A19bcRNq_5JtdWLDOQIvIwXM44S8cwXCIg2xTNg';

// gid -> nombre interno
const PESTANAS = {
  donadores: process.env.GID_DONADORES,
  abrejim: process.env.GID_ABREJIM,
  mensualidades: process.env.GID_MENSUALIDADES,
  nominas: process.env.GID_NOMINAS,
  caja: process.env.GID_CAJA,
} as const;

async function fetchCsv(gid: string | undefined): Promise<Record<string, string>[]> {
  if (!gid) return [];
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${gid}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`No pude descargar gid=${gid} (${res.status})`);
  const csv = await res.text();
  return parse(csv, { columns: true, skip_empty_lines: true, trim: true });
}

function toInt(v: string | undefined): number {
  if (!v) return 0;
  const n = Number(String(v).replace(/[^\d-]/g, ''));
  return Number.isFinite(n) ? n : 0;
}

function pick(row: Record<string, string>, ...keys: string[]): string | undefined {
  for (const k of keys) {
    const found = Object.keys(row).find((rk) => rk.toLowerCase().trim() === k.toLowerCase());
    if (found && row[found]) return row[found].trim();
  }
  return undefined;
}

async function importDonadores() {
  const rows = await fetchCsv(PESTANAS.donadores);
  console.log(`Donadores: ${rows.length} filas`);
  for (const row of rows) {
    const nombre = pick(row, 'nombre', 'donador', 'name');
    if (!nombre) continue;
    const montoMensual = toInt(pick(row, 'monto mensual', 'monto', 'mensual', 'mensualidad'));
    const contacto = pick(row, 'contacto', 'telefono', 'teléfono', 'email') || null;
    await prisma.donador.upsert({
      where: { id: `imp-don-${nombre}` },
      update: { montoMensual, contacto },
      create: { id: `imp-don-${nombre}`, nombre, montoMensual, contacto },
    });
  }
}

async function importAbrejim() {
  const rows = await fetchCsv(PESTANAS.abrejim);
  console.log(`Abrejim: ${rows.length} filas`);
  for (const row of rows) {
    const nombre = pick(row, 'nombre', 'abrej', 'name');
    if (!nombre) continue;
    const nominaMensual = toInt(pick(row, 'nomina', 'nómina', 'monto', 'mensual'));
    const contacto = pick(row, 'contacto', 'telefono', 'teléfono', 'email') || null;
    await prisma.abrej.upsert({
      where: { id: `imp-abr-${nombre}` },
      update: { nominaMensual, contacto },
      create: { id: `imp-abr-${nombre}`, nombre, nominaMensual, contacto },
    });
  }
}

async function main() {
  await importDonadores();
  await importAbrejim();
  console.log('✓ Import completo');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
