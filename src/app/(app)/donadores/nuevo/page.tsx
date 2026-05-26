import { crearDonador } from '../actions';
import Link from 'next/link';

export default function NuevoDonadorPage() {
  return (
    <div className="space-y-4">
      <header>
        <Link href="/donadores" className="text-sm text-gray-400">← Volver</Link>
        <h1 className="text-2xl font-bold">Nuevo donador</h1>
      </header>
      <form action={crearDonador} className="card space-y-3">
        <div><label className="label">Nombre</label><input name="nombre" className="input" required /></div>
        <div><label className="label">Contacto</label><input name="contacto" className="input" placeholder="Teléfono / email" /></div>
        <div><label className="label">Monto mensual</label><input name="montoMensual" className="input" inputMode="numeric" placeholder="0" /></div>
        <button className="btn-primary w-full">Crear</button>
      </form>
    </div>
  );
}
