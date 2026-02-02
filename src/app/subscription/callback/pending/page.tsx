import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, Info } from 'lucide-react';

export default function PendingPage() {

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <Card className="border-yellow-200 shadow-lg">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
            <Clock className="w-10 h-10 text-yellow-600" />
          </div>
          <CardTitle className="text-3xl">Pago Pendiente</CardTitle>
          <CardDescription className="text-base">
            Tu pago está siendo procesado
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Processing Info */}
          <div className="flex items-start gap-3 p-4 bg-yellow-50 rounded-lg border border-yellow-100">
            <Info className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
            <div className="space-y-2">
              <h3 className="font-semibold text-sm">¿Qué significa esto?</h3>
              <p className="text-sm text-muted-foreground">
                Tu pago está siendo verificado por MercadoPago. Este proceso puede tardar
                algunos minutos, dependiendo del método de pago utilizado.
              </p>
            </div>
          </div>

          {/* What happens next */}
          <div className="space-y-3 p-4 bg-muted rounded-lg">
            <h3 className="font-semibold">¿Qué sucederá ahora?</h3>
            <ul className="text-sm space-y-2 text-muted-foreground">
              <li>• Te notificaremos por email cuando se confirme el pago</li>
              <li>• Tu suscripción se activará automáticamente</li>
              <li>• Puedes verificar el estado en tu dashboard</li>
              <li>• El proceso puede tomar de 5 a 15 minutos</li>
            </ul>
          </div>

          {/* Payment Methods Info */}
          <div className="space-y-2 p-4 bg-blue-50 rounded-lg border border-blue-100 text-sm">
            <p className="font-medium text-blue-900">Tiempos de procesamiento típicos:</p>
            <ul className="space-y-1 text-blue-800">
              <li>• Tarjeta de crédito/débito: 5-10 minutos</li>
              <li>• Transferencia bancaria: 1-2 días hábiles</li>
              <li>• Efectivo (Pago en efectivo): Inmediato tras el pago</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Link href="/dashboard">
              <Button className="w-full" size="lg">
                Ir al Dashboard
              </Button>
            </Link>
            <Link href="/dashboard/subscription">
              <Button variant="outline" className="w-full" size="lg">
                Ver Estado de Suscripción
              </Button>
            </Link>
          </div>

          {/* Help Section */}
          <div className="text-center pt-4 border-t">
            <p className="text-sm text-muted-foreground mb-2">
              Si después de 24 horas no has recibido confirmación:
            </p>
            <Button asChild variant="link" className="text-primary">
              <a href="mailto:support@reservapp.com">Contactar Soporte</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
