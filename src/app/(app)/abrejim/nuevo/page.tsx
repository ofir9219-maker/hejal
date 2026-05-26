import { crearAbrej } from '../actions';
import Link from 'next/link';

export default function NuevoAbrejPage() {
  return (
    <div className="space-y-4">
      <Link href="/abrejim" className="text-sm text-gray-400">← Volver</Link>
      <h1 className="text-2xl font-bold">Nuevo abrej</h1>
      <form action={crearAbrej} className="card space-y-3">
        <div><label className="label">Nombre</label><input name="nombre" className="input" required /></div>
        <div><label className="label">Contacto</label><input name="contacto" className="input" /></div>
        <div><label className="label">Nómina mensual</label><input name="nominaMensual" className="input" inputMode="numeric" placeholder="0" /></div>
        <button className="btn-primary w-full">Crear</button>
      </form>
    </div>
  );
}
