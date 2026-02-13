'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, ShieldAlert, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface PromoteUserButtonProps {
  userId: string;
  currentIsAdmin: boolean;
}

/**
 * PromoteUserButton Component
 *
 * Toggle button to promote/demote user admin status.
 * Reuses existing /api/admin/users/[id]/promote endpoint.
 *
 * Features:
 * - Confirmation dialog before action
 * - Optimistic UI updates
 * - Uses router.refresh() to reload server component data
 * - Prevents self-demotion (handled by API)
 */
export function PromoteUserButton({ userId, currentIsAdmin }: PromoteUserButtonProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/users/${userId}/promote`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAdmin: !currentIsAdmin }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update user');
      }

      // Reload server component data
      router.refresh();
      setIsOpen(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al actualizar usuario');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button
        variant={currentIsAdmin ? 'destructive' : 'default'}
        onClick={() => setIsOpen(true)}
      >
        {currentIsAdmin ? (
          <>
            <ShieldAlert className="h-4 w-4 mr-2" />
            Remover Admin
          </>
        ) : (
          <>
            <Shield className="h-4 w-4 mr-2" />
            Promover a Admin
          </>
        )}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {currentIsAdmin
                ? 'Remover privilegios de administrador'
                : 'Promover a administrador'}
            </DialogTitle>
            <DialogDescription>
              {currentIsAdmin
                ? '¿Estás seguro de que deseas remover los privilegios de administrador a este usuario?'
                : '¿Estás seguro de que deseas otorgar privilegios de administrador a este usuario?'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button onClick={handleConfirm} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Procesando...
                </>
              ) : (
                'Confirmar'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
