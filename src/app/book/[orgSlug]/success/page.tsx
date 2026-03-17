import Link from 'next/link';
import { CheckCircle } from 'lucide-react';

export default function DropInSuccessPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <CheckCircle className="h-16 w-16 text-success" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">
          Reserva confirmada
        </h1>
        <p className="text-muted-foreground">
          Tu reserva ha sido confirmada exitosamente. Revisa tu email para ver
          los detalles de tu reserva.
        </p>
        <Link
          href="/"
          className="inline-block px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
