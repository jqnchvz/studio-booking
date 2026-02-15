'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatCLP, formatChileanDate } from '@/lib/utils/format';
import type { UserDetail } from '@/types/admin';

interface UserPaymentHistoryProps {
  payments: UserDetail['payments'];
}

/**
 * UserPaymentHistory Component
 *
 * Displays user's payment history in a table.
 * Shows last 50 payments with status badges.
 */
export function UserPaymentHistory({ payments }: UserPaymentHistoryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Historial de Pagos</CardTitle>
      </CardHeader>
      <CardContent>
        {payments.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No hay pagos registrados
          </p>
        ) : (
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="text-sm">
                      {formatChileanDate(
                        new Date(payment.paidAt || payment.createdAt)
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {payment.planName}
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCLP(payment.totalAmount)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          payment.status === 'approved'
                            ? 'default'
                            : payment.status === 'pending'
                            ? 'secondary'
                            : 'destructive'
                        }
                      >
                        {payment.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        {payments.length > 0 && (
          <p className="text-xs text-muted-foreground mt-2">
            Mostrando los últimos {payments.length} pagos
          </p>
        )}
      </CardContent>
    </Card>
  );
}
