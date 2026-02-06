import { Heading, Section, Text } from '@react-email/components';
import * as React from 'react';
import { colors, EmailLayout, styles } from './components/email-layout';

interface PaymentSuccessProps {
  name?: string;
  amount: number;
  planName: string;
  paymentDate: Date;
  paymentId: string;
  nextBillingDate: Date;
}

/**
 * Payment success email template
 * Sent when a payment is successfully processed
 */
export function PaymentSuccess({
  name = 'there',
  amount,
  planName,
  paymentDate,
  paymentId,
  nextBillingDate,
}: PaymentSuccessProps) {
  const formattedAmount = new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
  }).format(amount);

  const formattedPaymentDate = new Intl.DateTimeFormat('es-CL', {
    dateStyle: 'long',
    timeStyle: 'short',
  }).format(paymentDate);

  const formattedNextBillingDate = new Intl.DateTimeFormat('es-CL', {
    dateStyle: 'long',
  }).format(nextBillingDate);

  return (
    <EmailLayout preview={`Pago de ${formattedAmount} confirmado`}>
      <Heading style={styles.heading}>Pago confirmado</Heading>

      <Text style={styles.text}>Hola {name},</Text>

      <Text style={styles.text}>
        Hemos recibido tu pago exitosamente. Gracias por mantener tu suscripcion
        al dia.
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
          Pago procesado correctamente
        </Text>
      </Section>

      <Section style={styles.infoBox}>
        <Text style={{ ...styles.textSmall, margin: 0, fontWeight: 600 }}>
          Detalles del pago
        </Text>
        <Text style={{ ...styles.textSmall, margin: '12px 0 0 0' }}>
          <strong>Plan:</strong> {planName}
        </Text>
        <Text style={{ ...styles.textSmall, margin: '4px 0 0 0' }}>
          <strong>Monto:</strong> {formattedAmount}
        </Text>
        <Text style={{ ...styles.textSmall, margin: '4px 0 0 0' }}>
          <strong>Fecha de pago:</strong> {formattedPaymentDate}
        </Text>
        <Text style={{ ...styles.textSmall, margin: '4px 0 0 0' }}>
          <strong>ID de transaccion:</strong> {paymentId}
        </Text>
        <Text
          style={{
            ...styles.textSmall,
            margin: '12px 0 0 0',
            paddingTop: '12px',
            borderTop: `1px solid ${colors.border}`,
          }}
        >
          <strong>Proximo cobro:</strong> {formattedNextBillingDate}
        </Text>
      </Section>

      <Text style={styles.textSmall}>
        Guarda este correo como comprobante de pago. Si tienes alguna pregunta
        sobre tu facturacion, no dudes en contactarnos.
      </Text>
    </EmailLayout>
  );
}

export default PaymentSuccess;

/**
 * Plain text version of the email
 */
export function paymentSuccessText({
  name = 'there',
  amount,
  planName,
  paymentDate,
  paymentId,
  nextBillingDate,
}: PaymentSuccessProps): string {
  const formattedAmount = new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
  }).format(amount);

  const formattedPaymentDate = new Intl.DateTimeFormat('es-CL', {
    dateStyle: 'long',
    timeStyle: 'short',
  }).format(paymentDate);

  const formattedNextBillingDate = new Intl.DateTimeFormat('es-CL', {
    dateStyle: 'long',
  }).format(nextBillingDate);

  return `
Pago confirmado

Hola ${name},

Hemos recibido tu pago exitosamente. Gracias por mantener tu suscripcion al dia.

Detalles del pago:
- Plan: ${planName}
- Monto: ${formattedAmount}
- Fecha de pago: ${formattedPaymentDate}
- ID de transaccion: ${paymentId}

Proximo cobro: ${formattedNextBillingDate}

Guarda este correo como comprobante de pago. Si tienes alguna pregunta sobre tu facturacion, no dudes en contactarnos.

Saludos,
El equipo de Reservapp
  `.trim();
}
