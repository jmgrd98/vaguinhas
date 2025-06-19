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
  Img,
} from '@react-email/components';

interface ConfirmEmailNotificationEmailProps {
  confirmationLink: string;
  currentYear: string | number;
}

const ConfirmEmailNotificationEmail: React.FC<ConfirmEmailNotificationEmailProps> = ({ confirmationLink, currentYear }) => {
  return (
    <Html>
      <Head />
      <Preview>Você esqueceu de confirmar seu e-mail?</Preview>
      <Body style={mainStyle}>
        <Container style={containerStyle}>
          {/* Logo section */}
          <Section style={logoSectionStyle}>
            <Img
              src="cid:logo@vaguinhas"
              alt="vaguinhas logo"
              width="200"
              style={logoStyle}
            />
          </Section>

          {/* Heading */}
          <Section style={sectionStyle}>
            <Heading style={headingStyle}>Você esqueceu de confirmar seu e-mail?</Heading>
            <Text style={textStyle}>
              Você se inscreveu para receber vaguinhas mas esqueceu de confirmar seu e-mail? 🤔
            </Text>
            <Text style={textStyle}>
              <a href={confirmationLink} style={linkStyle}>
                Clique aqui
              </a>{' '}
              para confirmar seu e-mail para começar a receber vaguinhas de tecnologia! 🚀
            </Text>

            <Text style={textStyle}>
              Se você gostou das vaguinhas ou se possui alguma dúvida, sinta-se livre para me chamar no{' '}
              <a href="https://linkedin.com/in/joao-marcelo-dantas" target="_blank" rel="noopener noreferrer" style={linkStyle}>
                LinkedIn
              </a>{' '}
              para levar uma ideia! 😊
            </Text>
          </Section>

          {/* Divider and Footer */}
          <Hr style={hrStyle} />
          <Text style={footerStyle}>vaguinhas - {currentYear}</Text>
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

const logoSectionStyle: React.CSSProperties = {
  padding: '20px 0',
  textAlign: 'center',
};

const logoStyle: React.CSSProperties = {
  height: 'auto',
  width: '200px',
  maxWidth: '100%',
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

const linkStyle: React.CSSProperties = {
  color: '#ff914d',
  textDecoration: 'none',
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

export default ConfirmEmailNotificationEmail;
