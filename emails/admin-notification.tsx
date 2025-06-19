import React from 'react';
import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Section,
  Heading,
  Text,
  Hr,
} from '@react-email/components';

interface AdminNotificationEmailProps {
  userEmail: string;
  currentYear: string | number;
}

const AdminNotificationEmail: React.FC<AdminNotificationEmailProps> = ({ userEmail, currentYear }) => {
  return (
    <Html>
      <Head />
      <Preview>Novo cadastro realizado!</Preview>
      <Body style={mainStyle}>
        <Container style={containerStyle}>
          <Section style={sectionStyle}>
            <Heading style={headingStyle}>Novo cadastro realizado!</Heading>
            <Text style={textStyle}>
              O seguinte e-mail foi cadastrado no sistema:
            </Text>
            <Text style={emailBoxStyle}>{userEmail}</Text>
            <Hr style={hrStyle} />
            <Text style={footerStyle}>Sistema Vaguinhas - {currentYear}</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

// Styles
const mainStyle: React.CSSProperties = {
  backgroundColor: '#ffffff',
  margin: '0',
  padding: '0',
  width: '100%',
  fontFamily: 'Arial, sans-serif',
};

const containerStyle: React.CSSProperties = {
  maxWidth: '600px',
  margin: '0 auto',
  padding: '20px',
};

const sectionStyle: React.CSSProperties = {
  margin: '0',
  padding: '0',
};

const headingStyle: React.CSSProperties = {
  color: '#ff914d',
  fontSize: '24px',
  marginTop: '0',
};

const textStyle: React.CSSProperties = {
  fontSize: '16px',
  lineHeight: '1.5',
};

const emailBoxStyle: React.CSSProperties = {
  fontSize: '16px',
  lineHeight: '1.5',
  backgroundColor: '#f3f4f6',
  padding: '10px',
  borderRadius: '5px',
  wordBreak: 'break-all',
};

const hrStyle: React.CSSProperties = {
  margin: '30px 0',
  border: 'none',
  borderTop: '1px solid #e5e7eb',
};

const footerStyle: React.CSSProperties = {
  fontSize: '12px',
  color: '#6b7280',
};

export default AdminNotificationEmail;
