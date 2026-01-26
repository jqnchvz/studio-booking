'use client';

import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatCLP, formatChileanDate } from '@/lib/utils/format';
import { FileText } from 'lucide-react';

interface Payment {
  id: string;
  amount: number;
  penaltyFee: number;
  totalAmount: number;
  status: string;
  dueDate: string;
  paidAt: string | null;
  createdAt: string;
}

interface PaymentHistoryProps {
  payments: Payment[];
}

const PAYMENT_STATUS_CONFIG = {
  approved: {
    label: 'Aprobado',
    variant: 'default' as const,
  },
  pending: {
    label: 'Pendiente',
    variant: 'outline' as const,
  },
  rejected: {
    label: 'Rechazado',
    variant: 'destructive' as const,
  },
  refunded: {
    label: 'Reembolsado',
    variant: 'secondary' as const,
  },
};

export function PaymentHistory({ payments }: PaymentHistoryProps) {
  if (payments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Historial de Pagos</CardTitle>
          <CardDescription>
            No hay pagos registrados en los últimos 12 meses
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Historial de Pagos</CardTitle>
        <CardDescription>
          Últimos {payments.length} pagos (últimos 12 meses)
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Monto Base</TableHead>
              <TableHead>Recargo</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Comprobante</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.map((payment) => {
              const statusConfig =
                PAYMENT_STATUS_CONFIG[
                  payment.status as keyof typeof PAYMENT_STATUS_CONFIG
                ] || PAYMENT_STATUS_CONFIG.pending;

              const displayDate = payment.paidAt
                ? formatChileanDate(new Date(payment.paidAt))
                : formatChileanDate(new Date(payment.createdAt));

              return (
                <TableRow key={payment.id}>
                  <TableCell className="font-medium">{displayDate}</TableCell>
                  <TableCell>{formatCLP(payment.amount)}</TableCell>
                  <TableCell>
                    {payment.penaltyFee > 0 ? (
                      <span className="text-destructive">
                        {formatCLP(payment.penaltyFee)}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatCLP(payment.totalAmount)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusConfig.variant}>
                      {statusConfig.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {payment.status === 'approved' && (
                      <button
                        className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                        onClick={() => {
                          // TODO: Implement receipt download
                          console.log('Download receipt for payment:', payment.id);
                        }}
                      >
                        <FileText className="w-4 h-4" />
                        Ver
                      </button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
