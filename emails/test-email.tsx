import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface TestEmailProps {
  name?: string;
}

/**
 * Test Email Template
 * Used for testing email configuration and delivery
 */
export function TestEmail({ name = 'there' }: TestEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Test email from Reservapp</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Email Service Test</Heading>
          <Text style={text}>Hello {name}!</Text>
          <Text style={text}>
            This is a test email from <strong>Reservapp</strong> to verify that
            the email service is configured correctly.
          </Text>
          <Section style={codeBox}>
            <Text style={codeText}>✅ Email service is working!</Text>
          </Section>
          <Text style={footer}>
            If you received this email, your Resend integration is set up
            correctly.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default TestEmail;

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
};

const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '40px 0',
  padding: '0',
  textAlign: 'center' as const,
};

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
  textAlign: 'left' as const,
  padding: '0 40px',
};

const codeBox = {
  background: '#f4f4f4',
  borderRadius: '4px',
  margin: '24px 40px',
  padding: '16px',
};

const codeText = {
  color: '#15c',
  fontSize: '18px',
  fontWeight: 'bold',
  textAlign: 'center' as const,
  margin: '0',
};

const footer = {
  color: '#8898aa',
  fontSize: '14px',
  lineHeight: '24px',
  textAlign: 'center' as const,
  padding: '0 40px',
  marginTop: '24px',
};
