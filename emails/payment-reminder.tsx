import { Button, Heading, Section, Text } from '@react-email/components';
import * as React from 'react';
import { colors, EmailLayout, styles } from './components/email-layout';

interface PaymentReminderProps {
  paymentUrl: string;
  name?: string;
  amount: number;
  dueDate: Date;
  daysUntilDue: number;
  planName: string;
}

/**
 * Payment reminder email template
 * Sent 7, 3, and 1 day(s) before payment is due
 */
export function PaymentReminder({
  paymentUrl,
  name = 'there',
  amount,
  dueDate,
  daysUntilDue,
  planName,
}: PaymentReminderProps) {
  const formattedAmount = new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
  }).format(amount);

  const formattedDueDate = new Intl.DateTimeFormat('es-CL', {
    dateStyle: 'long',
  }).format(dueDate);

  const urgencyText =
    daysUntilDue === 1
      ? 'manana'
      : daysUntilDue === 3
        ? 'en 3 dias'
        : 'en 7 dias';

  const isUrgent = daysUntilDue <= 3;

  return (
    <EmailLayout
      preview={`Tu pago de ${formattedAmount} vence ${urgencyText}`}
    >
      <Heading style={styles.heading}>Recordatorio de pago</Heading>

      <Text style={styles.text}>Hola {name},</Text>

      <Text style={styles.text}>
        Te recordamos que tu pago por el plan {planName} vence {urgencyText}.
        Por favor, realiza el pago antes de la fecha de vencimiento para evitar
        interrupciones en tu servicio.
      </Text>

      <Section style={isUrgent ? styles.warningBox : styles.infoBox}>
        <Text style={{ ...styles.textSmall, margin: 0 }}>
          <strong>Plan:</strong> {planName}
        </Text>
        <Text style={{ ...styles.textSmall, margin: '4px 0 0 0' }}>
          <strong>Monto:</strong> {formattedAmount}
        </Text>
        <Text style={{ ...styles.textSmall, margin: '4px 0 0 0' }}>
          <strong>Fecha de vencimiento:</strong> {formattedDueDate}
        </Text>
        {isUrgent && (
          <Text
            style={{
              ...styles.textSmall,
              margin: '8px 0 0 0',
              color: colors.warning,
              fontWeight: 600,
            }}
          >
            {daysUntilDue === 1
              ? 'Vence manana - paga hoy para evitar recargos'
              : 'Vence pronto - no olvides pagar'}
          </Text>
        )}
      </Section>

      <Section style={styles.center}>
        <Button href={paymentUrl} style={styles.button}>
          Pagar ahora
        </Button>
      </Section>

      <Text style={styles.textSmall}>
        Si ya realizaste el pago, por favor ignora este correo. Los pagos pueden
        tardar hasta 24 horas en reflejarse en nuestro sistema.
      </Text>
    </EmailLayout>
  );
}

export default PaymentReminder;

/**
 * Plain text version of the email
 */
export function paymentReminderText({
  paymentUrl,
  name = 'there',
  amount,
  dueDate,
  daysUntilDue,
  planName,
}: PaymentReminderProps): string {
  const formattedAmount = new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
  }).format(amount);

  const formattedDueDate = new Intl.DateTimeFormat('es-CL', {
    dateStyle: 'long',
  }).format(dueDate);

  const urgencyText =
    daysUntilDue === 1
      ? 'manana'
      : daysUntilDue === 3
        ? 'en 3 dias'
        : 'en 7 dias';

  return `
Recordatorio de pago

Hola ${name},

Te recordamos que tu pago por el plan ${planName} vence ${urgencyText}. Por favor, realiza el pago antes de la fecha de vencimiento para evitar interrupciones en tu servicio.

Detalles del pago:
- Plan: ${planName}
- Monto: ${formattedAmount}
- Fecha de vencimiento: ${formattedDueDate}

Realiza tu pago aqui:
${paymentUrl}

Si ya realizaste el pago, por favor ignora este correo. Los pagos pueden tardar hasta 24 horas en reflejarse en nuestro sistema.

Saludos,
El equipo de Reservapp
  `.trim();
}
