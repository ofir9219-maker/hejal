import { Nav } from '@/components/nav';
import { Providers } from '@/components/providers';
import { requireSession } from '@/lib/auth';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  await requireSession();
  return (
    <Providers>
      <Nav />
      <main className="max-w-5xl mx-auto p-4 pb-24 md:pb-8">{children}</main>
    </Providers>
  );
}
