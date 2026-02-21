import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Autenticación - Reservapp',
  description: 'Inicia sesión o crea una cuenta',
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background:
          'radial-gradient(ellipse 90% 70% at 50% -10%, oklch(68% 0.16 68 / 0.18), transparent), oklch(98.5% 0.007 80)',
      }}
    >
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
