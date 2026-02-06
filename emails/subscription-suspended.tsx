import { Button, Heading, Section, Text } from '@react-email/components';
import * as React from 'react';
import { colors, EmailLayout, styles } from './components/email-layout';

interface SubscriptionSuspendedProps {
  paymentUrl: string;
  name?: string;
  planName: string;
  suspendedAt: Date;
  reason: 'payment_failed' | 'grace_period_expired';
  outstandingAmount?: number;
}

/**
 * Subscription suspended email template
 * Sent when a subscription is suspended due to payment failure
 */
export function SubscriptionSuspended({
  paymentUrl,
  name = 'there',
  planName,
  suspendedAt,
  reason,
  outstandingAmount,
}: SubscriptionSuspendedProps) {
  const formattedSuspendedAt = new Intl.DateTimeFormat('es-CL', {
    dateStyle: 'long',
  }).format(suspendedAt);

  const formattedAmount = outstandingAmount
    ? new Intl.NumberFormat('es-CL', {
        style: 'currency',
        currency: 'CLP',
      }).format(outstandingAmount)
    : null;

  const reasonText =
    reason === 'payment_failed'
      ? 'debido a multiples intentos de pago fallidos'
      : 'porque el periodo de gracia ha expirado';

  return (
    <EmailLayout preview="Tu suscripcion ha sido suspendida">
      <Heading style={styles.heading}>Suscripcion suspendida</Heading>

      <Text style={styles.text}>Hola {name},</Text>

      <Text style={styles.text}>
        Lamentamos informarte que tu suscripcion al plan {planName} ha sido
        suspendida {reasonText}.
      </Text>

      <Section style={styles.dangerBox}>
        <Text
          style={{
            ...styles.textSmall,
            margin: 0,
            fontWeight: 600,
            color: colors.danger,
          }}
        >
          Acceso suspendido
        </Text>
        <Text style={{ ...styles.textSmall, margin: '8px 0 0 0' }}>
          Ya no tienes acceso al sistema de reservas. Tus reservas existentes
          han sido canceladas automaticamente.
        </Text>
      </Section>

      <Section style={styles.infoBox}>
        <Text style={{ ...styles.textSmall, margin: 0, fontWeight: 600 }}>
          Detalles de la suspension
        </Text>
        <Text style={{ ...styles.textSmall, margin: '12px 0 0 0' }}>
          <strong>Plan:</strong> {planName}
        </Text>
        <Text style={{ ...styles.textSmall, margin: '4px 0 0 0' }}>
          <strong>Fecha de suspension:</strong> {formattedSuspendedAt}
        </Text>
        <Text style={{ ...styles.textSmall, margin: '4px 0 0 0' }}>
          <strong>Motivo:</strong>{' '}
          {reason === 'payment_failed'
            ? 'Pagos fallidos consecutivos'
            : 'Periodo de gracia expirado'}
        </Text>
        {formattedAmount && (
          <Text style={{ ...styles.textSmall, margin: '4px 0 0 0' }}>
            <strong>Monto pendiente:</strong> {formattedAmount}
          </Text>
        )}
      </Section>

      <Text style={styles.subheading}>Como reactivar tu suscripcion</Text>

      <Text style={styles.text}>
        Para recuperar el acceso, simplemente realiza el pago pendiente. Tu
        suscripcion se reactivara automaticamente una vez confirmado el pago.
      </Text>

      <Section style={styles.center}>
        <Button href={paymentUrl} style={styles.buttonDanger}>
          Pagar y reactivar
        </Button>
      </Section>

      <Text style={styles.textSmall}>
        Si crees que esto es un error o necesitas ayuda con el pago, contactanos
        inmediatamente a soporte@reservapp.cl. Queremos ayudarte a resolver esta
        situacion.
      </Text>
    </EmailLayout>
  );
}

export default SubscriptionSuspended;

/**
 * Plain text version of the email
 */
export function subscriptionSuspendedText({
  paymentUrl,
  name = 'there',
  planName,
  suspendedAt,
  reason,
  outstandingAmount,
}: SubscriptionSuspendedProps): string {
  const formattedSuspendedAt = new Intl.DateTimeFormat('es-CL', {
    dateStyle: 'long',
  }).format(suspendedAt);

  const formattedAmount = outstandingAmount
    ? new Intl.NumberFormat('es-CL', {
        style: 'currency',
        currency: 'CLP',
      }).format(outstandingAmount)
    : null;

  const reasonText =
    reason === 'payment_failed'
      ? 'debido a multiples intentos de pago fallidos'
      : 'porque el periodo de gracia ha expirado';

  return `
SUSCRIPCION SUSPENDIDA

Hola ${name},

Lamentamos informarte que tu suscripcion al plan ${planName} ha sido suspendida ${reasonText}.

ACCESO SUSPENDIDO
Ya no tienes acceso al sistema de reservas. Tus reservas existentes han sido canceladas automaticamente.

Detalles de la suspension:
- Plan: ${planName}
- Fecha de suspension: ${formattedSuspendedAt}
- Motivo: ${reason === 'payment_failed' ? 'Pagos fallidos consecutivos' : 'Periodo de gracia expirado'}
${formattedAmount ? `- Monto pendiente: ${formattedAmount}` : ''}

COMO REACTIVAR TU SUSCRIPCION
Para recuperar el acceso, simplemente realiza el pago pendiente. Tu suscripcion se reactivara automaticamente una vez confirmado el pago.

Paga y reactiva aqui:
${paymentUrl}

Si crees que esto es un error o necesitas ayuda con el pago, contactanos inmediatamente a soporte@reservapp.cl. Queremos ayudarte a resolver esta situacion.

Saludos,
El equipo de Reservapp
  `.trim();
}
