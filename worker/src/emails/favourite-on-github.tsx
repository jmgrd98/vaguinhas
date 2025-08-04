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
import { 
    mainStyle,
    containerStyle,
    logoStyle,
    logoSectionStyle,
    sectionStyle,
    headingStyle,
    textStyle,
    linkStyle,
    hrStyle,
    footerStyle
} from './styles';

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
              Se você gostou das vaguinhas ou se possui alguma dúvida, sinta-se livre para nos chamar no{' '}
              <a href="https://linkedin.com/company/vaguinhas" target="_blank" rel="noopener noreferrer" style={linkStyle}>
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

export default FavoriteGithubEmail;