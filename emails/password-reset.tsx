import { Button, Heading, Section, Text } from '@react-email/components';
import * as React from 'react';
import { EmailLayout, styles } from './components/email-layout';

interface PasswordResetProps {
  resetUrl: string;
  email: string;
  name?: string;
}

/**
 * Password reset email template
 * Sent when a user requests to reset their password
 */
export function PasswordReset({
  resetUrl,
  email,
  name = 'there',
}: PasswordResetProps) {
  return (
    <EmailLayout preview="Restablece tu contrasena de Reservapp">
      <Heading style={styles.heading}>Restablece tu contrasena</Heading>

      <Text style={styles.text}>Hola {name},</Text>

      <Text style={styles.text}>
        Recibimos una solicitud para restablecer la contrasena de tu cuenta
        asociada a {email}. Haz clic en el boton de abajo para crear una nueva
        contrasena.
      </Text>

      <Section style={styles.center}>
        <Button href={resetUrl} style={styles.button}>
          Restablecer contrasena
        </Button>
      </Section>

      <Section style={styles.infoBox}>
        <Text style={{ ...styles.textSmall, margin: 0 }}>
          Si el boton no funciona, copia y pega el siguiente enlace en tu
          navegador:
        </Text>
        <Text
          style={{
            ...styles.textSmall,
            margin: '8px 0 0 0',
            wordBreak: 'break-all',
          }}
        >
          {resetUrl}
        </Text>
      </Section>

      <Section style={styles.warningBox}>
        <Text style={{ ...styles.textSmall, margin: 0, fontWeight: 600 }}>
          Aviso de seguridad
        </Text>
        <Text style={{ ...styles.textSmall, margin: '8px 0 0 0' }}>
          Este enlace expirara en 1 hora por motivos de seguridad. Si no
          solicitaste restablecer tu contrasena, puedes ignorar este correo de
          forma segura. Tu contrasena actual permanecera sin cambios.
        </Text>
      </Section>
    </EmailLayout>
  );
}

export default PasswordReset;

/**
 * Plain text version of the email
 */
export function passwordResetText({
  resetUrl,
  email,
  name = 'there',
}: PasswordResetProps): string {
  return `
Restablece tu contrasena

Hola ${name},

Recibimos una solicitud para restablecer la contrasena de tu cuenta asociada a ${email}. Visita el siguiente enlace para crear una nueva contrasena:

${resetUrl}

Este enlace expirara en 1 hora por motivos de seguridad.

Si no solicitaste restablecer tu contrasena, puedes ignorar este correo de forma segura. Tu contrasena actual permanecera sin cambios.

Saludos,
El equipo de Reservapp
  `.trim();
}
