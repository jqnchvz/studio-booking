import Link from 'next/link';
import {
  ExternalLink,
  KeyRound,
  Bell,
  ShieldCheck,
  ArrowLeft,
  Globe,
  UserPlus,
  AppWindow,
  Unlock,
  Webhook,
  Settings,
  AlertTriangle,
} from 'lucide-react';
import { OwnerSettingsNav } from '@/components/features/owner/OwnerSettingsNav';

export const metadata = { title: 'Guia MercadoPago' };

function StepCard({
  step,
  icon: Icon,
  title,
  children,
}: {
  step: number;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative rounded-xl border border-border bg-card p-6">
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-sm">
          {step}
        </div>
        <div className="space-y-3 min-w-0">
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-primary shrink-0" />
            <h3 className="font-semibold text-base">{title}</h3>
          </div>
          <div className="text-sm text-muted-foreground space-y-2">{children}</div>
        </div>
      </div>
    </div>
  );
}

function CredentialBadge({
  label,
  description,
  required,
}: {
  label: string;
  description: string;
  required: boolean;
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/50 p-3">
      <KeyRound className="h-4 w-4 text-primary shrink-0 mt-0.5" />
      <div>
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm text-foreground">{label}</span>
          {required ? (
            <span className="text-[10px] font-medium uppercase tracking-wider text-primary bg-primary/10 px-1.5 py-0.5 rounded">
              Requerido
            </span>
          ) : (
            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
              Recomendado
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
    </div>
  );
}

function TroubleshootRow({
  problem,
  solution,
}: {
  problem: string;
  solution: string;
}) {
  return (
    <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 py-3 border-b border-border last:border-0">
      <div className="flex items-start gap-2 sm:w-2/5">
        <AlertTriangle className="h-3.5 w-3.5 text-warning shrink-0 mt-0.5" />
        <span className="text-sm font-medium text-foreground">{problem}</span>
      </div>
      <p className="text-sm text-muted-foreground sm:w-3/5">{solution}</p>
    </div>
  );
}

export default function MercadoPagoGuidePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Configuracion</h1>
        <p className="text-muted-foreground">
          Administra los datos de tu organizacion
        </p>
      </div>

      <OwnerSettingsNav />

      {/* Header */}
      <div className="space-y-4">
        <Link
          href="/owner/settings/payment"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Volver a configuracion de pagos
        </Link>

        <div>
          <h2 className="text-xl font-bold">
            Guia: Obtener credenciales de MercadoPago
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Sigue estos pasos para conectar tu cuenta de MercadoPago y comenzar a
            recibir pagos de tus clientes.
          </p>
        </div>
      </div>

      {/* What you need */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Que necesitas configurar</h3>
        </div>
        <div className="grid gap-3">
          <CredentialBadge
            label="Access Token"
            description="Clave privada para procesar pagos desde el servidor. Comienza con APP_USR-..."
            required
          />
          <CredentialBadge
            label="Public Key"
            description="Clave publica para inicializar el checkout de pago en el navegador. Comienza con APP_USR-..."
            required
          />
          <CredentialBadge
            label="Webhook Secret"
            description="Clave secreta para verificar que las notificaciones de pago realmente vienen de MercadoPago."
            required={false}
          />
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-4">
        <StepCard step={1} icon={UserPlus} title="Crear una cuenta de MercadoPago">
          <p>
            Si aun no tienes cuenta, ve a{' '}
            <a
              href="https://www.mercadopago.cl"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline inline-flex items-center gap-1"
            >
              mercadopago.cl
              <ExternalLink className="h-3 w-3" />
            </a>{' '}
            y haz clic en <strong className="text-foreground">Crea tu cuenta</strong>.
          </p>
          <p>
            Completa el registro con tus datos personales o de empresa y verifica tu
            identidad segun lo solicite MercadoPago.
          </p>
        </StepCard>

        <StepCard step={2} icon={Globe} title="Acceder al portal de desarrolladores">
          <ol className="list-decimal list-inside space-y-1.5">
            <li>
              Ve a{' '}
              <a
                href="https://www.mercadopago.cl/developers/es"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline inline-flex items-center gap-1"
              >
                Mercado Pago Developers
                <ExternalLink className="h-3 w-3" />
              </a>
            </li>
            <li>
              Haz clic en <strong className="text-foreground">Ingresar</strong> (esquina superior derecha) e inicia sesion
              con tu cuenta de MercadoPago
            </li>
            <li>
              Haz clic en{' '}
              <a
                href="https://www.mercadopago.cl/developers/panel/app"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline inline-flex items-center gap-1"
              >
                Tus integraciones
                <ExternalLink className="h-3 w-3" />
              </a>
            </li>
          </ol>
        </StepCard>

        <StepCard step={3} icon={AppWindow} title="Crear una aplicacion">
          <ol className="list-decimal list-inside space-y-1.5">
            <li>
              En el panel de <strong className="text-foreground">Tus integraciones</strong>,
              haz clic en <strong className="text-foreground">Crear aplicacion</strong>
            </li>
            <li>
              Asigna un nombre descriptivo, ej.{' '}
              <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono text-foreground">
                Reservapp - Mi Estudio
              </code>
            </li>
            <li>
              Selecciona el modelo de integracion correspondiente a pagos online
            </li>
            <li>
              Haz clic en <strong className="text-foreground">Crear aplicacion</strong>
            </li>
          </ol>
        </StepCard>

        <StepCard
          step={4}
          icon={Unlock}
          title="Activar credenciales de produccion"
        >
          <p>
            Las credenciales de produccion permiten recibir pagos reales.
          </p>
          <ol className="list-decimal list-inside space-y-1.5">
            <li>
              Dentro de tu aplicacion, ve a{' '}
              <strong className="text-foreground">
                Produccion &gt; Credenciales de produccion
              </strong>{' '}
              en el menu lateral izquierdo
            </li>
            <li>
              En <strong className="text-foreground">Industria</strong>, selecciona el rubro de
              tu negocio (ej. Servicios, Deportes)
            </li>
            <li>
              En <strong className="text-foreground">Sitio web</strong>, ingresa la URL de tu
              negocio
            </li>
            <li>
              Acepta la Declaracion de Privacidad y los Terminos y condiciones
            </li>
            <li>
              Completa el reCAPTCHA y haz clic en{' '}
              <strong className="text-foreground">
                Activar credenciales de produccion
              </strong>
            </li>
          </ol>
          <div className="rounded-lg border border-border bg-muted/50 p-3 mt-2">
            <p className="text-xs">
              <strong className="text-foreground">Resultado:</strong> Veras dos
              credenciales que necesitas copiar:
            </p>
            <ul className="mt-1.5 space-y-1 text-xs">
              <li>
                <code className="bg-muted px-1 py-0.5 rounded font-mono text-foreground">
                  Public Key
                </code>{' '}
                — clave publica (comienza con APP_USR-)
              </li>
              <li>
                <code className="bg-muted px-1 py-0.5 rounded font-mono text-foreground">
                  Access Token
                </code>{' '}
                — clave privada, mas larga (comienza con APP_USR-)
              </li>
            </ul>
          </div>
          <div className="rounded-lg border border-warning/30 bg-warning/10 p-3 mt-1">
            <p className="text-xs text-warning">
              <strong>Importante:</strong> El Access Token es una clave privada. No la
              compartas con nadie ni la expongas publicamente.
            </p>
          </div>
        </StepCard>

        <StepCard step={5} icon={Webhook} title="Configurar Webhooks">
          <p>
            Los webhooks permiten que MercadoPago notifique a Reservapp
            automaticamente cuando ocurre un pago, rechazo o cancelacion.
          </p>
          <ol className="list-decimal list-inside space-y-1.5">
            <li>
              Dentro de tu aplicacion, ve a{' '}
              <strong className="text-foreground">
                Webhooks &gt; Configurar notificaciones
              </strong>{' '}
              en el menu lateral
            </li>
            <li>
              En <strong className="text-foreground">URL modo produccion</strong>,
              ingresa la URL de webhooks de tu sitio:
            </li>
          </ol>
          <div className="rounded-lg bg-muted p-3 mt-1">
            <code className="text-xs font-mono text-foreground break-all">
              https://TU-DOMINIO/api/webhooks/mercadopago
            </code>
            <p className="text-xs mt-1.5">
              Reemplaza{' '}
              <code className="bg-background px-1 py-0.5 rounded font-mono">
                TU-DOMINIO
              </code>{' '}
              con el dominio donde corre tu Reservapp.
            </p>
          </div>
          <ol className="list-decimal list-inside space-y-1.5" start={3}>
            <li>
              Selecciona los <strong className="text-foreground">eventos</strong>:
            </li>
          </ol>
          <ul className="ml-4 space-y-1">
            <li className="flex items-center gap-2">
              <Bell className="h-3 w-3 text-primary" />
              <span>
                <strong className="text-foreground">Pagos</strong> (payment)
              </span>
            </li>
            <li className="flex items-center gap-2">
              <Bell className="h-3 w-3 text-primary" />
              <span>
                <strong className="text-foreground">Planes de suscripcion</strong>{' '}
                (subscription_preapproval)
              </span>
            </li>
          </ul>
          <ol className="list-decimal list-inside space-y-1.5" start={4}>
            <li>
              Haz clic en <strong className="text-foreground">Guardar</strong>
            </li>
            <li>
              Al guardar, MercadoPago generara una{' '}
              <strong className="text-foreground">clave secreta</strong> (Webhook
              Secret).{' '}
              <span className="text-foreground font-medium">
                Copiala inmediatamente.
              </span>
            </li>
          </ol>
          <div className="rounded-lg border border-border bg-muted/50 p-3 mt-1">
            <p className="text-xs">
              Si necesitas regenerar la clave secreta, haz clic en{' '}
              <strong className="text-foreground">Restablecer</strong> en MercadoPago.
              Recuerda actualizarla tambien en Reservapp.
            </p>
          </div>
        </StepCard>

        <StepCard
          step={6}
          icon={Settings}
          title="Ingresar las credenciales en Reservapp"
        >
          <ol className="list-decimal list-inside space-y-1.5">
            <li>
              Ve a{' '}
              <Link
                href="/owner/settings/payment"
                className="text-primary hover:underline"
              >
                Configuracion &gt; Pagos
              </Link>
            </li>
            <li>
              Ingresa las credenciales:
              <ul className="ml-5 mt-1.5 space-y-1 list-disc">
                <li>
                  <strong className="text-foreground">Access Token</strong> — la clave
                  privada del paso 4
                </li>
                <li>
                  <strong className="text-foreground">Public Key</strong> — la clave
                  publica del paso 4
                </li>
                <li>
                  <strong className="text-foreground">Webhook Secret</strong> — la clave
                  secreta del paso 5
                </li>
              </ul>
            </li>
            <li>
              Haz clic en{' '}
              <strong className="text-foreground">Probar conexion</strong> para
              verificar que el Access Token es valido
            </li>
            <li>
              Haz clic en <strong className="text-foreground">Guardar</strong>
            </li>
          </ol>
          <div className="rounded-lg border border-border bg-muted/50 p-3 mt-2">
            <p className="text-xs">
              <ShieldCheck className="h-3 w-3 text-success inline mr-1" />
              Tus credenciales se almacenan encriptadas con AES-256-GCM. Nunca se
              muestran completas en la interfaz.
            </p>
          </div>
        </StepCard>
      </div>

      {/* Troubleshooting */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <h3 className="font-semibold">Problemas frecuentes</h3>
        <div>
          <TroubleshootRow
            problem="&laquo;Probar conexion&raquo; falla"
            solution="Verifica que copiaste el Access Token completo (es largo). Asegurate de usar las credenciales de produccion, no las de prueba."
          />
          <TroubleshootRow
            problem="Los pagos no se reflejan"
            solution="Revisa que la URL de webhook sea correcta y que seleccionaste los eventos payment y subscription_preapproval en MercadoPago."
          />
          <TroubleshootRow
            problem="Error de firma en webhooks"
            solution="Verifica que el Webhook Secret en Reservapp coincide con el generado en MercadoPago. Si lo regeneraste en MP, actualizalo tambien aqui."
          />
          <TroubleshootRow
            problem="Credenciales de produccion no aparecen"
            solution="Debes activarlas primero completando la industria, sitio web y aceptando los terminos (ver paso 4)."
          />
        </div>
      </div>

      {/* CTA */}
      <div className="flex justify-center pb-4">
        <Link
          href="/owner/settings/payment"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <KeyRound className="h-4 w-4" />
          Ir a configurar credenciales
        </Link>
      </div>
    </div>
  );
}
