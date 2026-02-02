import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XCircle, AlertCircle } from 'lucide-react';

export default function FailurePage() {

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <Card className="border-red-200 shadow-lg">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <XCircle className="w-10 h-10 text-red-600" />
          </div>
          <CardTitle className="text-3xl">Pago Rechazado</CardTitle>
          <CardDescription className="text-base">
            No pudimos procesar tu pago
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Possible Reasons */}
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-red-50 rounded-lg border border-red-100">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div className="space-y-2">
                <h3 className="font-semibold text-sm">Posibles razones del rechazo:</h3>
                <ul className="text-sm space-y-1 text-muted-foreground list-disc list-inside">
                  <li>Fondos insuficientes en la cuenta</li>
                  <li>Tarjeta rechazada por el banco emisor</li>
                  <li>Datos de la tarjeta incorrectos</li>
                  <li>Límite de compra excedido</li>
                  <li>Tarjeta expirada o bloqueada</li>
                  <li>Error técnico temporal</li>
                </ul>
              </div>
            </div>
          </div>

          {/* What to do next */}
          <div className="space-y-3 p-4 bg-muted rounded-lg">
            <h3 className="font-semibold">¿Qué puedo hacer?</h3>
            <ul className="text-sm space-y-2 text-muted-foreground">
              <li>• Verifica que los datos de tu tarjeta sean correctos</li>
              <li>• Asegúrate de tener fondos suficientes</li>
              <li>• Intenta con otro método de pago</li>
              <li>• Contacta a tu banco si el problema persiste</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Link href="/dashboard/subscribe">
              <Button className="w-full" size="lg">
                Intentar Nuevamente
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="outline" className="w-full" size="lg">
                Volver al Dashboard
              </Button>
            </Link>
          </div>

          {/* Support Contact */}
          <div className="text-center pt-4 border-t">
            <p className="text-sm text-muted-foreground mb-3">
              ¿Necesitas ayuda?
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
