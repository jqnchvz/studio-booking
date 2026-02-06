import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface EmailLayoutProps {
  preview: string;
  children: React.ReactNode;
}

/**
 * Shared email layout component for all Reservapp emails.
 * Provides consistent branding, header, and footer.
 */
export function EmailLayout({ preview, children }: EmailLayoutProps) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header with Logo */}
          <Section style={header}>
            <Img
              src={`${baseUrl}/logo.png`}
              width="150"
              height="40"
              alt="Reservapp"
              style={logo}
            />
          </Section>

          {/* Main Content */}
          <Section style={content}>{children}</Section>

          {/* Footer */}
          <Hr style={hr} />
          <Section style={footer}>
            <Text style={footerText}>
              <Link href={baseUrl} style={footerLink}>
                Reservapp
              </Link>{' '}
              - Tu plataforma de reservas
            </Text>
            <Text style={footerSubtext}>
              Si tienes preguntas, contactanos en{' '}
              <Link href="mailto:soporte@reservapp.cl" style={footerLink}>
                soporte@reservapp.cl
              </Link>
            </Text>
            <Text style={footerSubtext}>
              <Link href={`${baseUrl}/privacy`} style={footerLink}>
                Politica de Privacidad
              </Link>
              {' | '}
              <Link href={`${baseUrl}/terms`} style={footerLink}>
                Terminos de Servicio
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// Base URL for links and assets
const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://reservapp.cl';

// Brand colors
export const colors = {
  primary: '#2563eb', // Blue
  primaryDark: '#1d4ed8',
  secondary: '#64748b', // Slate
  success: '#16a34a', // Green
  warning: '#ca8a04', // Yellow
  danger: '#dc2626', // Red
  text: '#1e293b', // Slate 800
  textMuted: '#64748b', // Slate 500
  background: '#f8fafc', // Slate 50
  white: '#ffffff',
  border: '#e2e8f0', // Slate 200
};

// Shared styles
const main = {
  backgroundColor: colors.background,
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif',
};

const container = {
  backgroundColor: colors.white,
  margin: '0 auto',
  padding: '0',
  maxWidth: '600px',
  borderRadius: '8px',
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  marginTop: '40px',
  marginBottom: '40px',
};

const header = {
  backgroundColor: colors.primary,
  padding: '24px 40px',
  borderRadius: '8px 8px 0 0',
  textAlign: 'center' as const,
};

const logo = {
  margin: '0 auto',
};

const content = {
  padding: '32px 40px',
};

const hr = {
  borderColor: colors.border,
  margin: '0',
};

const footer = {
  padding: '24px 40px',
  textAlign: 'center' as const,
};

const footerText = {
  color: colors.textMuted,
  fontSize: '14px',
  lineHeight: '24px',
  margin: '0 0 8px 0',
};

const footerSubtext = {
  color: colors.textMuted,
  fontSize: '12px',
  lineHeight: '20px',
  margin: '0 0 4px 0',
};

const footerLink = {
  color: colors.primary,
  textDecoration: 'none',
};

// Exportable shared styles for use in individual templates
export const styles = {
  heading: {
    color: colors.text,
    fontSize: '24px',
    fontWeight: 'bold' as const,
    lineHeight: '32px',
    margin: '0 0 16px 0',
  },
  subheading: {
    color: colors.text,
    fontSize: '18px',
    fontWeight: '600' as const,
    lineHeight: '28px',
    margin: '24px 0 12px 0',
  },
  text: {
    color: colors.text,
    fontSize: '16px',
    lineHeight: '26px',
    margin: '0 0 16px 0',
  },
  textSmall: {
    color: colors.textMuted,
    fontSize: '14px',
    lineHeight: '22px',
    margin: '0 0 12px 0',
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: '6px',
    color: colors.white,
    display: 'inline-block',
    fontSize: '16px',
    fontWeight: '600' as const,
    lineHeight: '1',
    padding: '14px 28px',
    textAlign: 'center' as const,
    textDecoration: 'none',
  },
  buttonDanger: {
    backgroundColor: colors.danger,
    borderRadius: '6px',
    color: colors.white,
    display: 'inline-block',
    fontSize: '16px',
    fontWeight: '600' as const,
    lineHeight: '1',
    padding: '14px 28px',
    textAlign: 'center' as const,
    textDecoration: 'none',
  },
  buttonSuccess: {
    backgroundColor: colors.success,
    borderRadius: '6px',
    color: colors.white,
    display: 'inline-block',
    fontSize: '16px',
    fontWeight: '600' as const,
    lineHeight: '1',
    padding: '14px 28px',
    textAlign: 'center' as const,
    textDecoration: 'none',
  },
  infoBox: {
    backgroundColor: '#eff6ff', // Blue 50
    borderLeft: `4px solid ${colors.primary}`,
    borderRadius: '4px',
    padding: '16px',
    margin: '24px 0',
  },
  warningBox: {
    backgroundColor: '#fefce8', // Yellow 50
    borderLeft: `4px solid ${colors.warning}`,
    borderRadius: '4px',
    padding: '16px',
    margin: '24px 0',
  },
  dangerBox: {
    backgroundColor: '#fef2f2', // Red 50
    borderLeft: `4px solid ${colors.danger}`,
    borderRadius: '4px',
    padding: '16px',
    margin: '24px 0',
  },
  successBox: {
    backgroundColor: '#f0fdf4', // Green 50
    borderLeft: `4px solid ${colors.success}`,
    borderRadius: '4px',
    padding: '16px',
    margin: '24px 0',
  },
  detailRow: {
    display: 'flex' as const,
    justifyContent: 'space-between' as const,
    borderBottom: `1px solid ${colors.border}`,
    padding: '12px 0',
  },
  detailLabel: {
    color: colors.textMuted,
    fontSize: '14px',
  },
  detailValue: {
    color: colors.text,
    fontSize: '14px',
    fontWeight: '600' as const,
  },
  link: {
    color: colors.primary,
    textDecoration: 'underline',
  },
  center: {
    textAlign: 'center' as const,
  },
};

export default EmailLayout;
