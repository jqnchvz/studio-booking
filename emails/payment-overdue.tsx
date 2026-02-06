import { Button, Heading, Section, Text } from '@react-email/components';
import * as React from 'react';
import { colors, EmailLayout, styles } from './components/email-layout';

interface PaymentOverdueProps {
  paymentUrl: string;
  name?: string;
  baseAmount: number;
  penaltyFee: number;
  totalAmount: number;
  gracePeriodEnd: Date;
  planName: string;
}

/**
 * Payment overdue email template
 * Sent when payment is past due, during grace period
 */
export function PaymentOverdue({
  paymentUrl,
  name = 'there',
  baseAmount,
  penaltyFee,
  totalAmount,
  gracePeriodEnd,
  planName,
}: PaymentOverdueProps) {
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
    }).format(amount);

  const formattedGracePeriodEnd = new Intl.DateTimeFormat('es-CL', {
    dateStyle: 'long',
    timeStyle: 'short',
  }).format(gracePeriodEnd);

  return (
    <EmailLayout preview="Tu pago esta vencido - accion requerida">
      <Heading style={styles.heading}>Pago vencido</Heading>

      <Text style={styles.text}>Hola {name},</Text>

      <Text style={styles.text}>
        Tu pago por el plan {planName} esta vencido. Para evitar la suspension
        de tu cuenta, por favor realiza el pago lo antes posible.
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
          Periodo de gracia activo
        </Text>
        <Text style={{ ...styles.textSmall, margin: '8px 0 0 0' }}>
          Tienes hasta el {formattedGracePeriodEnd} para realizar el pago. Si no
          pagas antes de esa fecha, tu cuenta sera suspendida y perderas acceso
          al sistema de reservas.
        </Text>
      </Section>

      <Section style={styles.infoBox}>
        <Text style={{ ...styles.textSmall, margin: 0, fontWeight: 600 }}>
          Desglose del monto
        </Text>
        <Text style={{ ...styles.textSmall, margin: '8px 0 0 0' }}>
          Monto base: {formatCurrency(baseAmount)}
        </Text>
        {penaltyFee > 0 && (
          <Text
            style={{
              ...styles.textSmall,
              margin: '4px 0 0 0',
              color: colors.danger,
            }}
          >
            Recargo por mora: {formatCurrency(penaltyFee)}
          </Text>
        )}
        <Text
          style={{
            ...styles.textSmall,
            margin: '8px 0 0 0',
            fontWeight: 600,
            borderTop: `1px solid ${colors.border}`,
            paddingTop: '8px',
          }}
        >
          Total a pagar: {formatCurrency(totalAmount)}
        </Text>
      </Section>

      <Section style={styles.center}>
        <Button href={paymentUrl} style={styles.buttonDanger}>
          Pagar ahora
        </Button>
      </Section>

      <Text style={styles.textSmall}>
        Si tienes problemas para realizar el pago o necesitas asistencia,
        contactanos a soporte@reservapp.cl. Estamos aqui para ayudarte.
      </Text>
    </EmailLayout>
  );
}

export default PaymentOverdue;

/**
 * Plain text version of the email
 */
export function paymentOverdueText({
  paymentUrl,
  name = 'there',
  baseAmount,
  penaltyFee,
  totalAmount,
  gracePeriodEnd,
  planName,
}: PaymentOverdueProps): string {
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
    }).format(amount);

  const formattedGracePeriodEnd = new Intl.DateTimeFormat('es-CL', {
    dateStyle: 'long',
    timeStyle: 'short',
  }).format(gracePeriodEnd);

  return `
PAGO VENCIDO - ACCION REQUERIDA

Hola ${name},

Tu pago por el plan ${planName} esta vencido. Para evitar la suspension de tu cuenta, por favor realiza el pago lo antes posible.

PERIODO DE GRACIA ACTIVO
Tienes hasta el ${formattedGracePeriodEnd} para realizar el pago. Si no pagas antes de esa fecha, tu cuenta sera suspendida y perderas acceso al sistema de reservas.

Desglose del monto:
- Monto base: ${formatCurrency(baseAmount)}
${penaltyFee > 0 ? `- Recargo por mora: ${formatCurrency(penaltyFee)}` : ''}
- Total a pagar: ${formatCurrency(totalAmount)}

Realiza tu pago aqui:
${paymentUrl}

Si tienes problemas para realizar el pago o necesitas asistencia, contactanos a soporte@reservapp.cl. Estamos aqui para ayudarte.

Saludos,
El equipo de Reservapp
  `.trim();
}
