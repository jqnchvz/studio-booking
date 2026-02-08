import { Button, Heading, Section, Text } from '@react-email/components';
import * as React from 'react';
import { colors, EmailLayout, styles } from './components/email-layout';

interface ReservationCancelledProps {
  dashboardUrl: string;
  name?: string;
  reservationId: string;
  resourceName: string;
  resourceType: string;
  title: string;
  description?: string;
  startTime: string; // ISO 8601
  endTime: string; // ISO 8601
  cancelledAt: string; // ISO 8601
}

/**
 * Reservation cancellation email template (Spanish)
 * Sent immediately after successful reservation cancellation
 */
export function ReservationCancelled({
  dashboardUrl,
  name = 'ahí',
  reservationId,
  resourceName,
  resourceType,
  title,
  description,
  startTime,
  endTime,
  cancelledAt,
}: ReservationCancelledProps) {
  const startDate = new Date(startTime);
  const endDate = new Date(endTime);
  const cancelDate = new Date(cancelledAt);

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

  const formattedCancelDate = new Intl.DateTimeFormat('es-CL', {
    timeZone: 'America/Santiago',
    dateStyle: 'full',
    timeStyle: 'short',
  }).format(cancelDate);

  return (
    <EmailLayout preview={`Reserva cancelada: ${title}`}>
      <Heading style={styles.heading}>Reserva cancelada</Heading>

      <Text style={styles.text}>Hola {name},</Text>

      <Text style={styles.text}>
        Tu reserva ha sido cancelada exitosamente. A continuación, encontrarás los detalles
        de la reserva cancelada:
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

        <Text
          style={{
            ...styles.textSmall,
            margin: '4px 0 0 0',
            color: colors.textMuted,
          }}
        >
          <strong>Cancelada el:</strong> {formattedCancelDate}
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

      <Text style={styles.text}>
        El espacio ahora está disponible para otros usuarios. Si cambias de opinión, puedes
        crear una nueva reserva en cualquier momento.
      </Text>

      <Section style={styles.center}>
        <Button href={dashboardUrl} style={styles.button}>
          Ver mis reservas
        </Button>
      </Section>

      <Text style={styles.textSmall}>
        ¿Tienes preguntas? Responde a este correo y te ayudaremos.
      </Text>
    </EmailLayout>
  );
}

export default ReservationCancelled;

/**
 * Plain text version of the email
 */
export function reservationCancelledText({
  name = 'ahí',
  reservationId,
  resourceName,
  resourceType,
  title,
  description,
  startTime,
  endTime,
  cancelledAt,
}: ReservationCancelledProps): string {
  const startDate = new Date(startTime);
  const endDate = new Date(endTime);
  const cancelDate = new Date(cancelledAt);

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

  const formattedCancelDate = new Intl.DateTimeFormat('es-CL', {
    timeZone: 'America/Santiago',
    dateStyle: 'full',
    timeStyle: 'short',
  }).format(cancelDate);

  return `
Reserva cancelada

Hola ${name},

Tu reserva ha sido cancelada exitosamente. A continuación, encontrarás los detalles de la reserva cancelada:

${title}
${description ? description + '\n' : ''}
- Recurso: ${resourceName} (${resourceType})
- Fecha: ${formattedDate}
- Horario: ${formattedStartTime} - ${formattedEndTime}
- Cancelada el: ${formattedCancelDate}
- ID de reserva: ${reservationId}

El espacio ahora está disponible para otros usuarios. Si cambias de opinión, puedes crear una nueva reserva en cualquier momento.

¿Tienes preguntas? Responde a este correo y te ayudaremos.

Saludos,
El equipo de Reservapp
  `.trim();
}
