import { Button, Heading, Section, Text } from '@react-email/components';
import * as React from 'react';
import { colors, EmailLayout, styles } from './components/email-layout';

interface SubscriptionActivatedProps {
  dashboardUrl: string;
  name?: string;
  planName: string;
  planPrice: number;
  billingPeriod: string;
  activatedAt: Date;
}

/**
 * Subscription activated email template
 * Sent when a user's subscription is successfully activated
 */
export function SubscriptionActivated({
  dashboardUrl,
  name = 'there',
  planName,
  planPrice,
  billingPeriod,
  activatedAt,
}: SubscriptionActivatedProps) {
  const formattedPrice = new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
  }).format(planPrice);

  const formattedActivatedAt = new Intl.DateTimeFormat('es-CL', {
    dateStyle: 'long',
  }).format(activatedAt);

  return (
    <EmailLayout preview="Tu suscripcion ha sido activada - Bienvenido a Reservapp">
      <Heading style={styles.heading}>Bienvenido a Reservapp!</Heading>

      <Text style={styles.text}>Hola {name},</Text>

      <Text style={styles.text}>
        Tu suscripcion ha sido activada exitosamente. Ya puedes comenzar a
        reservar espacios de estudio cuando quieras.
      </Text>

      <Section style={styles.successBox}>
        <Text
          style={{
            ...styles.textSmall,
            margin: 0,
            fontWeight: 600,
            color: colors.success,
          }}
        >
          Suscripcion activa
        </Text>
        <Text style={{ ...styles.textSmall, margin: '8px 0 0 0' }}>
          Tienes acceso completo al sistema de reservas.
        </Text>
      </Section>

      <Section style={styles.infoBox}>
        <Text style={{ ...styles.textSmall, margin: 0, fontWeight: 600 }}>
          Detalles de tu plan
        </Text>
        <Text style={{ ...styles.textSmall, margin: '12px 0 0 0' }}>
          <strong>Plan:</strong> {planName}
        </Text>
        <Text style={{ ...styles.textSmall, margin: '4px 0 0 0' }}>
          <strong>Precio:</strong> {formattedPrice} / {billingPeriod}
        </Text>
        <Text style={{ ...styles.textSmall, margin: '4px 0 0 0' }}>
          <strong>Activado el:</strong> {formattedActivatedAt}
        </Text>
      </Section>

      <Section style={styles.center}>
        <Button href={dashboardUrl} style={styles.buttonSuccess}>
          Ir al dashboard
        </Button>
      </Section>

      <Text style={styles.subheading}>Que puedes hacer ahora?</Text>

      <Text style={styles.text}>
        Con tu suscripcion activa, puedes:
      </Text>

      <Text style={{ ...styles.textSmall, margin: '0 0 8px 16px' }}>
        • Reservar espacios de estudio
      </Text>
      <Text style={{ ...styles.textSmall, margin: '0 0 8px 16px' }}>
        • Ver tu historial de reservas
      </Text>
      <Text style={{ ...styles.textSmall, margin: '0 0 8px 16px' }}>
        • Gestionar tu perfil y preferencias
      </Text>
      <Text style={{ ...styles.textSmall, margin: '0 0 16px 16px' }}>
        • Acceder a soporte prioritario
      </Text>

      <Text style={styles.textSmall}>
        Si tienes alguna pregunta o necesitas ayuda para comenzar, no dudes en
        contactarnos. Estamos aqui para ti.
      </Text>
    </EmailLayout>
  );
}

export default SubscriptionActivated;

/**
 * Plain text version of the email
 */
export function subscriptionActivatedText({
  dashboardUrl,
  name = 'there',
  planName,
  planPrice,
  billingPeriod,
  activatedAt,
}: SubscriptionActivatedProps): string {
  const formattedPrice = new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
  }).format(planPrice);

  const formattedActivatedAt = new Intl.DateTimeFormat('es-CL', {
    dateStyle: 'long',
  }).format(activatedAt);

  return `
Bienvenido a Reservapp!

Hola ${name},

Tu suscripcion ha sido activada exitosamente. Ya puedes comenzar a reservar espacios de estudio cuando quieras.

SUSCRIPCION ACTIVA
Tienes acceso completo al sistema de reservas.

Detalles de tu plan:
- Plan: ${planName}
- Precio: ${formattedPrice} / ${billingPeriod}
- Activado el: ${formattedActivatedAt}

Accede a tu dashboard:
${dashboardUrl}

Que puedes hacer ahora?
- Reservar espacios de estudio
- Ver tu historial de reservas
- Gestionar tu perfil y preferencias
- Acceder a soporte prioritario

Si tienes alguna pregunta o necesitas ayuda para comenzar, no dudes en contactarnos. Estamos aqui para ti.

Saludos,
El equipo de Reservapp
  `.trim();
}
