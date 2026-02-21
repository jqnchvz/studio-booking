import { Construction } from 'lucide-react';

export default function AdminSubscriptionsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Suscripciones</h1>
        <p className="text-muted-foreground">Gestión de suscripciones del sistema</p>
      </div>

      <div className="flex flex-col items-center justify-center py-24 text-center gap-4 text-muted-foreground">
        <Construction className="h-12 w-12 opacity-40" />
        <p className="text-lg font-medium">Próximamente</p>
        <p className="text-sm max-w-xs">
          Esta sección está en desarrollo y estará disponible en una próxima versión.
        </p>
      </div>
    </div>
  );
}
