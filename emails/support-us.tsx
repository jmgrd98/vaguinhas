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

interface SupportUsEmailProps {
  currentYear: string | number;
  pixKey?: string;
  baseURL?: string;
  useCid?: boolean;
}

const SupportUsEmail: React.FC<SupportUsEmailProps> = ({ 
  currentYear,
  pixKey = 'vaguinhas@vaguinhas.com.br',
}) => {

    return (
    <Html>
      <Head />
      <Preview>Nós precisamos do seu apoio!</Preview>
      <Body style={mainStyle}>
        <Container style={containerStyle}>
          {/* Logo Section */}
          <Section style={logoSectionStyle}>
           <Img
              src={'https://www.vaguinhas.com.br/vaguinhas-logo.png'}
              // src={`${baseURL}/public/static/vaguinhas-logo.png`}
              alt="vaguinhas logo"
              width="200"
              style={logoStyle}
            />
          </Section>

          {/* Heading and Intro */}
          <Section style={sectionStyle}>
            <Heading style={headingStyle}>Nós precisamos do seu apoio!</Heading>
            <Text style={textStyle}>
              Nossa operação custa dinheiro e para continuar te mandando vaguinhas de forma gratuita, nós precisamos de fontes de renda alternativas.
            </Text>
            <Text style={textStyle}>
              Considere fazer uma doação de qualquer valor através do PIX <strong>{pixKey}</strong> para ajudar a nos manter online.
            </Text>
          </Section>

          {/* PIX QR Code Section */}
          <Section style={pixSectionStyle}>
            <Text style={textStyle}>
              Escaneie este QR Code para fazer uma doação via PIX:
            </Text>
            <Img
              src={'https://www.vaguinhas.com.br/qrcode-pix.png'}
              // src={`${baseURL}/public/static/qrcode-pix.png`}
              alt="QR Code PIX"
              width="180"
              height="180"
              style={pixQrStyle}
            />
            <Section style={pixInfoStyle}>
              <Text style={textStyle}>
                <strong>Chave PIX:</strong> {pixKey}
              </Text>
              <Text style={smallTextStyle}>
                Ou copie a chave e cole em seu aplicativo bancário
              </Text>
            </Section>
          </Section>

          {/* Footer and Contact */}
          <Section style={sectionStyle}>
            <Text style={textStyle}>
              Se você gostou das vaguinhas ou se possui alguma dúvita, sinta-se livre para me chamar no{' '}
              <a href="https://linkedin.com/in/joao-marcelo-dantas" target="_blank" rel="noopener noreferrer" style={linkStyle}>
                LinkedIn
              </a>{' '}
              para levar uma ideia! 😊
            </Text>
            <Text style={textStyle}>
              Caso não tenha sido você, por favor ignore este e-mail.
            </Text>
          </Section>

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

const pixSectionStyle: React.CSSProperties = {
  textAlign: 'center',
  margin: '25px 0',
  padding: '20px',
  backgroundColor: '#f8f9fa',
  borderRadius: '12px',
};

const pixQrStyle: React.CSSProperties = {
  width: '180px',
  height: '180px',
  display: 'block',
  margin: '10px auto',
};

const pixInfoStyle: React.CSSProperties = {
  marginTop: '20px',
};

const smallTextStyle: React.CSSProperties = {
  fontSize: '14px',
  color: '#6b7280',
  marginTop: '10px',
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

export default SupportUsEmail;