import Link from 'next/link';
import { XCircle } from 'lucide-react';

interface Props {
  params: Promise<{ orgSlug: string }>;
}

export default async function DropInFailurePage({ params }: Props) {
  const { orgSlug } = await params;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <XCircle className="h-16 w-16 text-destructive" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">
          Pago no completado
        </h1>
        <p className="text-muted-foreground">
          El pago fue cancelado o rechazado. No se realizó ningún cargo.
          Puedes intentarlo nuevamente.
        </p>
        <Link
          href={`/book/${orgSlug}`}
          className="inline-block px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition"
        >
          Intentar de nuevo
        </Link>
      </div>
    </div>
  );
}
