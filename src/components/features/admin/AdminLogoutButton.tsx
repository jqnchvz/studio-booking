'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';

export function AdminLogoutButton() {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      router.push('/login');
    }
  };

  return (
    <button
      onClick={handleLogout}
      disabled={loggingOut}
      className="flex items-center gap-2 text-xs text-sidebar-muted hover:text-sidebar-foreground transition-colors disabled:opacity-50"
    >
      <LogOut className="h-3 w-3" />
      {loggingOut ? 'Cerrando...' : 'Cerrar sesión'}
    </button>
  );
}
