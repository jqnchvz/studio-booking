'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface TenantDetailActionsProps {
  tenantId: string;
  tenantName: string;
  status: string;
}

export function TenantDetailActions({
  tenantId,
  tenantName,
  status,
}: TenantDetailActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const isSuspending = status === 'active';
  const newStatus = isSuspending ? 'suspended' : 'active';

  async function handleConfirm() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/organizations/${tenantId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setShowConfirm(false);
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  if (status !== 'active' && status !== 'suspended') return null;

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowConfirm(true)}
        className={
          isSuspending
            ? 'text-warning hover:text-warning border-warning/30 hover:bg-warning/10'
            : 'text-success hover:text-success border-success/30 hover:bg-success/10'
        }
      >
        {isSuspending ? 'Suspender' : 'Activar'}
      </Button>

      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isSuspending ? 'Suspender empresa' : 'Activar empresa'}
            </DialogTitle>
            <DialogDescription>
              {isSuspending
                ? `Al suspender "${tenantName}", todos sus usuarios perderán acceso a la plataforma. Puedes reactivarla en cualquier momento.`
                : `Al activar "${tenantName}", todos sus usuarios recuperarán acceso a la plataforma.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConfirm(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              variant={isSuspending ? 'destructive' : 'default'}
              onClick={handleConfirm}
              disabled={loading}
            >
              {loading
                ? 'Guardando...'
                : isSuspending
                  ? 'Sí, suspender'
                  : 'Sí, activar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
