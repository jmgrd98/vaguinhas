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

interface ConfirmationEmailProps {
  confirmationLink: string;
  currentYear: string | number;
  baseURL?: string;
  useCid?: boolean;
  password?: string;
}

const ConfirmationEmail: React.FC<ConfirmationEmailProps> = ({
  confirmationLink,
  currentYear,
  baseURL = 'https://www.vaguinhas.com.br',
  useCid = false,
  password
}) => {
  const logoSrc = useCid
    ? 'cid:logo@vaguinhas'
    : `${baseURL}/vaguinhas-logo.png`;

  return (
    <Html>
      <Head />
      <Preview>Obrigado por se cadastrar!</Preview>
      <Body style={mainStyle}>
        <Container style={containerStyle}>
          {/* Logo Section */}
          <Section style={logoSectionStyle}>
            <Img
              src={logoSrc}
              alt="Vaguinhas Logo"
              width="200"
              style={logoStyle}
            />
          </Section>

          {/* Heading and Content */}
          <Section style={sectionStyle}>
            <Heading style={headingStyle}>Obrigado por se cadastrar!</Heading>
            <Text style={textStyle}>
              Por favor confirme seu e-mail clicando no link abaixo:
            </Text>
            <Text style={textStyle}>
              <a href={confirmationLink} style={linkStyle}>
                Confirmar endereço de e-mail
              </a>
            </Text>
            <Text style={textStyle}>
              Você receberá vaguinhas de tecnologia nesse e-mail diariamente. 😊
            </Text>
            <Text style={textStyle}>
              Sua senha para acessar a área de assinante é: {password}
            </Text>
            <Text style={textStyle}>
              Se você possui alguma dúvida, sinta-se livre para responder a este e-mail que nós iremos lhe ajudar!
            </Text>
            <Text style={textStyle}>
              Caso não tenha sido você, por favor ignore este e-mail.
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
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
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

export default ConfirmationEmail;