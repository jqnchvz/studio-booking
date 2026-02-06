import { Button, Heading, Section, Text } from '@react-email/components';
import * as React from 'react';
import { colors, EmailLayout, styles } from './components/email-layout';

interface SubscriptionCancelledProps {
  reactivateUrl: string;
  name?: string;
  planName: string;
  accessUntil: Date;
  cancelledAt: Date;
}

/**
 * Subscription cancelled email template
 * Sent when a user cancels their subscription
 */
export function SubscriptionCancelled({
  reactivateUrl,
  name = 'there',
  planName,
  accessUntil,
  cancelledAt,
}: SubscriptionCancelledProps) {
  const formattedAccessUntil = new Intl.DateTimeFormat('es-CL', {
    dateStyle: 'long',
  }).format(accessUntil);

  const formattedCancelledAt = new Intl.DateTimeFormat('es-CL', {
    dateStyle: 'long',
  }).format(cancelledAt);

  return (
    <EmailLayout preview="Tu suscripcion ha sido cancelada">
      <Heading style={styles.heading}>Suscripcion cancelada</Heading>

      <Text style={styles.text}>Hola {name},</Text>

      <Text style={styles.text}>
        Confirmamos que tu suscripcion al plan {planName} ha sido cancelada.
        Lamentamos verte partir.
      </Text>

      <Section style={styles.warningBox}>
        <Text
          style={{
            ...styles.textSmall,
            margin: 0,
            fontWeight: 600,
            color: colors.warning,
          }}
        >
          Acceso hasta el {formattedAccessUntil}
        </Text>
        <Text style={{ ...styles.textSmall, margin: '8px 0 0 0' }}>
          Podras seguir usando el sistema de reservas hasta esta fecha. Despues
          de eso, perderas acceso a las funcionalidades de suscripcion.
        </Text>
      </Section>

      <Section style={styles.infoBox}>
        <Text style={{ ...styles.textSmall, margin: 0, fontWeight: 600 }}>
          Detalles de la cancelacion
        </Text>
        <Text style={{ ...styles.textSmall, margin: '12px 0 0 0' }}>
          <strong>Plan:</strong> {planName}
        </Text>
        <Text style={{ ...styles.textSmall, margin: '4px 0 0 0' }}>
          <strong>Fecha de cancelacion:</strong> {formattedCancelledAt}
        </Text>
        <Text style={{ ...styles.textSmall, margin: '4px 0 0 0' }}>
          <strong>Acceso hasta:</strong> {formattedAccessUntil}
        </Text>
      </Section>

      <Text style={styles.text}>
        Cambiaste de opinion? Puedes reactivar tu suscripcion en cualquier
        momento y recuperar todos los beneficios.
      </Text>

      <Section style={styles.center}>
        <Button href={reactivateUrl} style={styles.button}>
          Reactivar suscripcion
        </Button>
      </Section>

      <Text style={styles.textSmall}>
        Si cancelaste por error o tienes alguna pregunta, contactanos a
        soporte@reservapp.cl. Nos encantaria saber como podemos mejorar.
      </Text>
    </EmailLayout>
  );
}

export default SubscriptionCancelled;

/**
 * Plain text version of the email
 */
export function subscriptionCancelledText({
  reactivateUrl,
  name = 'there',
  planName,
  accessUntil,
  cancelledAt,
}: SubscriptionCancelledProps): string {
  const formattedAccessUntil = new Intl.DateTimeFormat('es-CL', {
    dateStyle: 'long',
  }).format(accessUntil);

  const formattedCancelledAt = new Intl.DateTimeFormat('es-CL', {
    dateStyle: 'long',
  }).format(cancelledAt);

  return `
Suscripcion cancelada

Hola ${name},

Confirmamos que tu suscripcion al plan ${planName} ha sido cancelada. Lamentamos verte partir.

ACCESO HASTA EL ${formattedAccessUntil.toUpperCase()}
Podras seguir usando el sistema de reservas hasta esta fecha. Despues de eso, perderas acceso a las funcionalidades de suscripcion.

Detalles de la cancelacion:
- Plan: ${planName}
- Fecha de cancelacion: ${formattedCancelledAt}
- Acceso hasta: ${formattedAccessUntil}

Cambiaste de opinion? Puedes reactivar tu suscripcion en cualquier momento:
${reactivateUrl}

Si cancelaste por error o tienes alguna pregunta, contactanos a soporte@reservapp.cl. Nos encantaria saber como podemos mejorar.

Saludos,
El equipo de Reservapp
  `.trim();
}
