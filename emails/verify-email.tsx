import { Button, Heading, Section, Text } from '@react-email/components';
import * as React from 'react';
import { EmailLayout, styles } from './components/email-layout';

interface VerifyEmailProps {
  verificationUrl: string;
  email: string;
  name?: string;
}

/**
 * Email verification template
 * Sent when a user registers or changes their email address
 */
export function VerifyEmail({
  verificationUrl,
  email,
  name = 'there',
}: VerifyEmailProps) {
  return (
    <EmailLayout preview="Verifica tu correo electronico para activar tu cuenta">
      <Heading style={styles.heading}>Verifica tu correo electronico</Heading>

      <Text style={styles.text}>Hola {name},</Text>

      <Text style={styles.text}>
        Gracias por registrarte en Reservapp. Para completar tu registro y
        activar tu cuenta, por favor verifica tu direccion de correo electronico
        ({email}).
      </Text>

      <Section style={styles.center}>
        <Button href={verificationUrl} style={styles.button}>
          Verificar correo electronico
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
          {verificationUrl}
        </Text>
      </Section>

      <Text style={styles.textSmall}>
        Este enlace expirara en 24 horas. Si no creaste una cuenta en Reservapp,
        puedes ignorar este correo.
      </Text>
    </EmailLayout>
  );
}

export default VerifyEmail;

/**
 * Plain text version of the email
 */
export function verifyEmailText({
  verificationUrl,
  email,
  name = 'there',
}: VerifyEmailProps): string {
  return `
Verifica tu correo electronico

Hola ${name},

Gracias por registrarte en Reservapp. Para completar tu registro y activar tu cuenta, por favor verifica tu direccion de correo electronico (${email}).

Haz clic en el siguiente enlace para verificar:
${verificationUrl}

Este enlace expirara en 24 horas.

Si no creaste una cuenta en Reservapp, puedes ignorar este correo.

Saludos,
El equipo de Reservapp
  `.trim();
}
