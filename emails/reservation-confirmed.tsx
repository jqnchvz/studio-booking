import { Button, Heading, Section, Text } from '@react-email/components';
import * as React from 'react';
import { colors, EmailLayout, styles } from './components/email-layout';

interface ReservationConfirmedProps {
  dashboardUrl: string;
  name?: string;
  reservationId: string;
  resourceName: string;
  resourceType: string;
  title: string;
  description?: string;
  startTime: string; // ISO 8601
  endTime: string; // ISO 8601
  attendees: number;
}

/**
 * Reservation confirmation email template (Spanish)
 * Sent immediately after successful reservation creation
 */
export function ReservationConfirmed({
  dashboardUrl,
  name = 'ahí',
  reservationId,
  resourceName,
  resourceType,
  title,
  description,
  startTime,
  endTime,
  attendees,
}: ReservationConfirmedProps) {
  const startDate = new Date(startTime);
  const endDate = new Date(endTime);

  const formattedDate = new Intl.DateTimeFormat('es-CL', {
    timeZone: 'America/Santiago',
    dateStyle: 'full',
  }).format(startDate);

  const formattedStartTime = new Intl.DateTimeFormat('es-CL', {
    timeZone: 'America/Santiago',
    hour: '2-digit',
    minute: '2-digit',
  }).format(startDate);

  const formattedEndTime = new Intl.DateTimeFormat('es-CL', {
    timeZone: 'America/Santiago',
    hour: '2-digit',
    minute: '2-digit',
  }).format(endDate);

  return (
    <EmailLayout preview={`Reserva confirmada: ${title}`}>
      <Heading style={styles.heading}>¡Reserva confirmada!</Heading>

      <Text style={styles.text}>Hola {name},</Text>

      <Text style={styles.text}>
        Tu reserva ha sido confirmada exitosamente. A continuación, encontrarás los detalles:
      </Text>

      <Section style={styles.infoBox}>
        <Text style={{ ...styles.textSmall, margin: 0, fontWeight: 600 }}>
          {title}
        </Text>

        {description && (
          <Text style={{ ...styles.textSmall, margin: '8px 0 0 0' }}>
            {description}
          </Text>
        )}

        <Text style={{ ...styles.textSmall, margin: '12px 0 0 0' }}>
          <strong>Recurso:</strong> {resourceName} ({resourceType})
        </Text>

        <Text style={{ ...styles.textSmall, margin: '4px 0 0 0' }}>
          <strong>Fecha:</strong> {formattedDate}
        </Text>

        <Text style={{ ...styles.textSmall, margin: '4px 0 0 0' }}>
          <strong>Horario:</strong> {formattedStartTime} - {formattedEndTime}
        </Text>

        <Text style={{ ...styles.textSmall, margin: '4px 0 0 0' }}>
          <strong>Asistentes:</strong> {attendees}
        </Text>

        <Text
          style={{
            ...styles.textSmall,
            margin: '4px 0 0 0',
            color: colors.textMuted,
          }}
        >
          <strong>ID de reserva:</strong> {reservationId}
        </Text>
      </Section>

      <Section style={styles.center}>
        <Button href={dashboardUrl} style={styles.button}>
          Ver detalles de la reserva
        </Button>
      </Section>

      <Text style={styles.textSmall}>
        Si necesitas modificar o cancelar tu reserva, puedes hacerlo desde tu panel de control
        hasta 24 horas antes de la fecha programada.
      </Text>

      <Text style={styles.textSmall}>
        ¿Tienes preguntas? Responde a este correo y te ayudaremos.
      </Text>
    </EmailLayout>
  );
}

export default ReservationConfirmed;

/**
 * Plain text version of the email
 */
export function reservationConfirmedText({
  name = 'ahí',
  reservationId,
  resourceName,
  resourceType,
  title,
  description,
  startTime,
  endTime,
  attendees,
}: ReservationConfirmedProps): string {
  const startDate = new Date(startTime);
  const endDate = new Date(endTime);

  const formattedDate = new Intl.DateTimeFormat('es-CL', {
    timeZone: 'America/Santiago',
    dateStyle: 'full',
  }).format(startDate);

  const formattedStartTime = new Intl.DateTimeFormat('es-CL', {
    timeZone: 'America/Santiago',
    hour: '2-digit',
    minute: '2-digit',
  }).format(startDate);

  const formattedEndTime = new Intl.DateTimeFormat('es-CL', {
    timeZone: 'America/Santiago',
    hour: '2-digit',
    minute: '2-digit',
  }).format(endDate);

  return `
¡Reserva confirmada!

Hola ${name},

Tu reserva ha sido confirmada exitosamente. A continuación, encontrarás los detalles:

${title}
${description ? description + '\n' : ''}
- Recurso: ${resourceName} (${resourceType})
- Fecha: ${formattedDate}
- Horario: ${formattedStartTime} - ${formattedEndTime}
- Asistentes: ${attendees}
- ID de reserva: ${reservationId}

Si necesitas modificar o cancelar tu reserva, puedes hacerlo desde tu panel de control hasta 24 horas antes de la fecha programada.

¿Tienes preguntas? Responde a este correo y te ayudaremos.

Saludos,
El equipo de Reservapp
  `.trim();
}
