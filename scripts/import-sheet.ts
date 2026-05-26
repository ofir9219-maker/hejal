import { PrismaClient } from '@prisma/client';
import { parse } from 'csv-parse/sync';

const prisma = new PrismaClient();

const SHEET_ID = process.env.SHEET_ID || '1fiy1A19bcRNq_5JtdWLDOQIvIwXM44S8cwXCIg2xTNg';
const BASE_YEAR = Number(process.env.BASE_YEAR || 2026);

const GIDS = {
  donadores: '400760593',
  abrejim: '1021411527',
  mensualidades: '1387077017',
  nominas: '412246709',
  caja: '1992561158',
};

const MONTH_MAP: Record<string, number> = {
  ene: 1, enero: 1,
  feb: 2, febrero: 2,
  mar: 3, marzo: 3,
  abr: 4, abril: 4,
  may: 5, mayo: 5,
  jun: 6, junio: 6,
  jul: 7, julio: 7,
  ago: 8, agosto: 8,
  sep: 9, septiembre: 9, set: 9, setiembre: 9,
  oct: 10, octubre: 10,
  nov: 11, noviembre: 11,
  dic: 12, diciembre: 12,
};

async function fetchCsv(gid: string): Promise<string> {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${gid}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`No pude descargar gid=${gid} (${res.status})`);
  return res.text();
}

function parseCsv(csv: string, skipRows = 0): string[][] {
  const rows = parse(csv, { skip_empty_lines: false, trim: true }) as string[][];
  return rows.slice(skipRows);
}

function toInt(v: string | undefined): number {
  if (!v) return 0;
  const n = Number(String(v).replace(/[^\d-]/g, ''));
  return Number.isFinite(n) ? n : 0;
}

function slugId(prefix: string, name: string): string {
  const slug = name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return `imp-${prefix}-${slug}`;
}

function parseFecha(s: string): Date | null {
  if (!s) return null;
  // ISO YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return new Date(s);
  // DD/MM/YYYY o D/M/YYYY
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

function mesAPeriodo(nombreMes: string, posicion: number, baseYear: number, mesesPrev: number[]): { periodo: string; nextPrev: number[] } {
  const key = nombreMes.toLowerCase().trim();
  const mes = MONTH_MAP[key];
  if (!mes) return { periodo: '', nextPrev: mesesPrev };
  let year = baseYear;
  // si el mes ya pasó (decrece respecto del anterior), incrementar año
  if (mesesPrev.length && mes <= Math.max(...mesesPrev) && mes < 5) {
    year = baseYear + 1;
  }
  return { periodo: `${year}-${String(mes).padStart(2, '0')}`, nextPrev: [...mesesPrev, mes] };
}

// ─── DONADORES ─────────────────────────────────────────────────────────────
async function importDonadores(): Promise<Map<string, string>> {
  const csv = await fetchCsv(GIDS.donadores);
  const rows = parseCsv(csv);
  const [header, ...data] = rows;
  const idx = {
    nombre: header.indexOf('Nombre'),
    email: header.indexOf('Email'),
    tel: header.indexOf('Teléfono'),
    monto: header.indexOf('Monto Mensual'),
    fecha: header.indexOf('Fecha Alta'),
  };
  const nameToId = new Map<string, string>();
  let count = 0;
  for (const row of data) {
    const nombre = (row[idx.nombre] || '').trim();
    if (!nombre) continue;
    const id = slugId('don', nombre);
    const email = (row[idx.email] || '').trim() || null;
    const tel = (row[idx.tel] || '').trim() || null;
    const contacto = [email, tel].filter(Boolean).join(' / ') || null;
    const montoMensual = toInt(row[idx.monto]);
    const fechaAlta = parseFecha(row[idx.fecha] || '');
    await prisma.donador.upsert({
      where: { id },
      update: { nombre, contacto, montoMensual },
      create: { id, nombre, contacto, montoMensual, creadoEn: fechaAlta || new Date() },
    });
    nameToId.set(nombre.toLowerCase(), id);
    count++;
  }
  console.log(`✓ Donadores: ${count}`);
  return nameToId;
}

// ─── ABREJIM ───────────────────────────────────────────────────────────────
async function importAbrejim(): Promise<Map<string, string>> {
  const csv = await fetchCsv(GIDS.abrejim);
  const rows = parseCsv(csv);
  const [header, ...data] = rows;
  const idx = {
    nombre: header.indexOf('Nombre'),
    email: header.indexOf('Email'),
    tel: header.indexOf('Teléfono'),
    hijos: header.indexOf('Hijos'),
    tipo: header.indexOf('Tipo'),
    sueldoEsp: header.indexOf('Sueldo Especial'),
  };
  const nameToId = new Map<string, string>();
  let count = 0;
  for (const row of data) {
    const nombre = (row[idx.nombre] || '').trim();
    if (!nombre) continue;
    const id = slugId('abr', nombre);
    const email = (row[idx.email] || '').trim() || null;
    const tel = (row[idx.tel] || '').trim() || null;
    const contacto = [email, tel].filter(Boolean).join(' / ') || null;
    const hijos = toInt(row[idx.hijos]);
    const tipo = (row[idx.tipo] || '').trim();
    const sueldoEsp = toInt(row[idx.sueldoEsp]);
    const notas = `Tipo: ${tipo} · Hijos: ${hijos}${sueldoEsp ? ` · Sueldo especial: ${sueldoEsp}` : ''}`;
    await prisma.abrej.upsert({
      where: { id },
      update: { nombre, contacto, notas },
      create: { id, nombre, contacto, notas, nominaMensual: sueldoEsp || 0 },
    });
    nameToId.set(nombre.toLowerCase(), id);
    count++;
  }
  console.log(`✓ Abrejim: ${count}`);
  return nameToId;
}

// ─── MENSUALIDADES ─────────────────────────────────────────────────────────
async function importMensualidades(donadoresMap: Map<string, string>) {
  const csv = await fetchCsv(GIDS.mensualidades);
  const rows = parseCsv(csv, 1); // saltar título
  const header = rows[0];
  const data = rows.slice(1);
  const colDonador = header.indexOf('Donador');
  const colMonto = header.indexOf('Monto Actual');
  // mapear columnas de meses
  const mesesCols: { col: number; periodo: string }[] = [];
  let mesesPrev: number[] = [];
  for (let i = colMonto + 1; i < header.length; i++) {
    const h = header[i] || '';
    if (/pagado|pendiente|avance|%/i.test(h)) break;
    const { periodo, nextPrev } = mesAPeriodo(h, i, BASE_YEAR, mesesPrev);
    if (!periodo) continue;
    mesesPrev = nextPrev;
    mesesCols.push({ col: i, periodo });
  }
  let count = 0;
  for (const row of data) {
    const nombre = (row[colDonador] || '').trim();
    if (!nombre) continue;
    const donadorId = donadoresMap.get(nombre.toLowerCase());
    if (!donadorId) { console.warn(`  Donador no encontrado: "${nombre}"`); continue; }
    const monto = toInt(row[colMonto]);
    for (const { col, periodo } of mesesCols) {
      const val = (row[col] || '').toString().trim().toUpperCase();
      const pagada = val === 'TRUE' || val === 'VERDADERO' || val === 'V';
      const montoCobrado = pagada ? monto : 0;
      const estado = pagada ? 'cobrada' : 'pendiente';
      await prisma.mensualidad.upsert({
        where: { donadorId_periodo: { donadorId, periodo } },
        update: { montoEsperado: monto, montoCobrado, estado, fechaCobro: pagada ? new Date(`${periodo}-15`) : null },
        create: { donadorId, periodo, montoEsperado: monto, montoCobrado, estado, fechaCobro: pagada ? new Date(`${periodo}-15`) : null },
      });
      count++;
    }
  }
  console.log(`✓ Mensualidades: ${count}`);
}

// ─── NÓMINAS ───────────────────────────────────────────────────────────────
async function importNominas(abrejimMap: Map<string, string>) {
  const csv = await fetchCsv(GIDS.nominas);
  const rows = parseCsv(csv, 1);
  const header = rows[0];
  const data = rows.slice(1);
  const colAbrej = header.indexOf('Abrej');
  const colSueldo = header.indexOf('Sueldo');
  const mesesCols: { col: number; periodo: string }[] = [];
  let mesesPrev: number[] = [];
  for (let i = colSueldo + 1; i < header.length; i++) {
    const h = header[i] || '';
    if (/pagado|pendiente|avance|%/i.test(h)) break;
    const { periodo, nextPrev } = mesAPeriodo(h, i, BASE_YEAR, mesesPrev);
    if (!periodo) continue;
    mesesPrev = nextPrev;
    mesesCols.push({ col: i, periodo });
  }
  let count = 0;
  for (const row of data) {
    const nombre = (row[colAbrej] || '').trim();
    if (!nombre) continue;
    const abrejId = abrejimMap.get(nombre.toLowerCase());
    if (!abrejId) { console.warn(`  Abrej no encontrado: "${nombre}"`); continue; }
    const sueldo = toInt(row[colSueldo]);
    // actualizar nomina mensual del abrej si está vacía
    await prisma.abrej.update({ where: { id: abrejId }, data: { nominaMensual: sueldo } });
    for (const { col, periodo } of mesesCols) {
      const val = (row[col] || '').toString().trim().toUpperCase();
      const pagada = val === 'TRUE' || val === 'VERDADERO' || val === 'V';
      const estado = pagada ? 'pagada' : 'pendiente';
      await prisma.nominaPagada.upsert({
        where: { abrejId_periodo: { abrejId, periodo } },
        update: { monto: sueldo, estado, fechaPago: pagada ? new Date(`${periodo}-15`) : null },
        create: { abrejId, periodo, monto: sueldo, estado, fechaPago: pagada ? new Date(`${periodo}-15`) : null },
      });
      count++;
    }
  }
  console.log(`✓ Nóminas: ${count}`);
}

// ─── CAJA ──────────────────────────────────────────────────────────────────
async function importCaja(donadoresMap: Map<string, string>, abrejimMap: Map<string, string>) {
  const csv = await fetchCsv(GIDS.caja);
  const rows = parseCsv(csv);
  const [header, ...data] = rows;
  const idx = {
    fecha: header.indexOf('Fecha'),
    tipo: header.indexOf('Tipo'),
    cat: header.indexOf('Categoría'),
    concepto: header.indexOf('Concepto'),
    monto: header.indexOf('Monto'),
    ref: header.indexOf('Referencia'),
  };
  // borrar movimientos previos de import para evitar duplicados
  await prisma.movimiento.deleteMany({ where: { categoria: { startsWith: 'imp:' } } });
  let count = 0;
  for (const row of data) {
    const fecha = parseFecha(row[idx.fecha] || '');
    if (!fecha) continue;
    const tipoRaw = (row[idx.tipo] || '').toLowerCase();
    const tipo = tipoRaw.includes('egres') || tipoRaw.includes('gasto') || tipoRaw.includes('nomi') ? 'egreso' : 'ingreso';
    const categoria = 'imp:' + ((row[idx.cat] || 'otro').toLowerCase());
    const monto = toInt(row[idx.monto]);
    if (monto <= 0) continue;
    const descripcion = (row[idx.concepto] || '').trim() || null;
    const ref = (row[idx.ref] || '').trim().toLowerCase();
    const donadorId = donadoresMap.get(ref) || null;
    const abrejId = abrejimMap.get(ref) || null;
    await prisma.movimiento.create({
      data: { fecha, tipo, categoria, monto, descripcion, donadorId, abrejId },
    });
    count++;
  }
  console.log(`✓ Caja: ${count}`);
}

async function main() {
  console.log(`Importando desde Sheet ${SHEET_ID} (año base ${BASE_YEAR})…`);
  const donadores = await importDonadores();
  const abrejim = await importAbrejim();
  await importMensualidades(donadores);
  await importNominas(abrejim);
  await importCaja(donadores, abrejim);
  console.log('\n✓ Import completo');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
