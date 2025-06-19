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

interface FavoriteGithubEmailProps {
  currentYear: string | number;
  useCid?: boolean; // Add useCid prop
}

const FavoriteGithubEmail: React.FC<FavoriteGithubEmailProps> = ({ 
  currentYear,
  useCid = false // Default to false
}) => {
  return (
    <Html>
      <Head />
      <Preview>Favorite-nos no GitHub!</Preview>
      <Body style={mainStyle}>
        <Container style={containerStyle}>
          {/* Logo Section - Updated with conditional source */}
          <Section style={logoSectionStyle}>
            <Img
              src={useCid ? "cid:logo@vaguinhas" : "https://www.vaguinhas.com.br/vaguinhas-logo.png"}
              alt="vaguinhas logo"
              width="200"
              style={logoStyle}
            />
          </Section>

          {/* Heading and Content */}
          <Section style={sectionStyle}>
            <Heading style={headingStyle}>Favorite-nos no GitHub!</Heading>
            <Text style={textStyle}>
              Ajude-nos a alcançar mais desenvolvedores que estão à procura de vaguinhas.
            </Text>
            <Text style={textStyle}>
              Acesse o{' '}
              <a href="https://github.com/jmgrd98/vaguinhas" target="_blank" rel="noopener noreferrer" style={linkStyle}>
                nosso repositório
              </a>{' '}
              e deixe sua estrelinha! ⭐
            </Text>
            <Text style={textStyle}>
              O seu apoio é muito importante para nos ajudar a crescer! 😉
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

// Styles remain the same
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

export default FavoriteGithubEmail;