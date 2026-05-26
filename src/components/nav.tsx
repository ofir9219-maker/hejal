'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';

const items = [
  { href: '/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/donadores', label: 'Donadores', icon: '💝' },
  { href: '/abrejim', label: 'Abrejim', icon: '👥' },
  { href: '/caja', label: 'Caja', icon: '💰' },
];

export function Nav() {
  const pathname = usePathname();
  return (
    <>
      {/* Desktop top bar */}
      <header className="hidden md:flex sticky top-0 z-30 bg-bg/80 backdrop-blur border-b border-border px-6 py-3 items-center gap-6">
        <Link href="/dashboard" className="font-bold text-lg">Hejal</Link>
        <nav className="flex gap-1 flex-1">
          {items.map((it) => (
            <Link key={it.href} href={it.href}
              className={`px-3 py-1.5 rounded-lg text-sm ${pathname?.startsWith(it.href) ? 'bg-accent text-white' : 'hover:bg-border'}`}>
              {it.label}
            </Link>
          ))}
        </nav>
        <button onClick={() => signOut({ callbackUrl: '/login' })} className="btn-ghost text-xs">Salir</button>
      </header>

      {/* Mobile bottom bar */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-panel border-t border-border grid grid-cols-4 pb-[env(safe-area-inset-bottom)]">
        {items.map((it) => {
          const active = pathname?.startsWith(it.href);
          return (
            <Link key={it.href} href={it.href}
              className={`flex flex-col items-center justify-center py-2 text-[11px] ${active ? 'text-accent' : 'text-gray-400'}`}>
              <span className="text-lg leading-none">{it.icon}</span>
              <span>{it.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
