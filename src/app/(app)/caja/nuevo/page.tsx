import { crearMovimiento } from '../actions';
import Link from 'next/link';

export default function NuevoMovimientoPage() {
  const hoy = new Date().toISOString().slice(0, 10);
  return (
    <div className="space-y-4">
      <Link href="/caja" className="text-sm text-gray-400">← Volver</Link>
      <h1 className="text-2xl font-bold">Nuevo movimiento</h1>
      <form action={crearMovimiento} className="card space-y-3">
        <div>
          <label className="label">Tipo</label>
          <select name="tipo" className="input">
            <option value="ingreso">Ingreso</option>
            <option value="egreso">Egreso</option>
          </select>
        </div>
        <div><label className="label">Categoría</label><input name="categoria" className="input" placeholder="donacion, nomina, gasto…" defaultValue="otro" /></div>
        <div><label className="label">Monto</label><input name="monto" className="input" inputMode="numeric" required /></div>
        <div><label className="label">Fecha</label><input name="fecha" type="date" className="input" defaultValue={hoy} /></div>
        <div><label className="label">Descripción</label><input name="descripcion" className="input" /></div>
        <button className="btn-primary w-full">Crear</button>
      </form>
    </div>
  );
}
