import React from 'react'
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
  Link,
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
  useCid?: boolean;
}

const FeedbackEmail: React.FC<FavoriteGithubEmailProps> = ({
  currentYear,
  useCid = false
}) => {
  return (
    <Html>
      <Head />
      <Preview>Nós estamos em constante evolução!</Preview>
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
            <Heading style={headingStyle}>Nós estamos em constante evolução!</Heading>
            <Text style={textStyle}>
              E para isso gostamos sempre de saber como está sendo a experiência dos nossos assinantes!
            </Text>

            {/* Updated link insertion */}
            <Text style={textStyle}>
              <Link
                href="https://vaguinhas.com.br/feedback"
                target="_blank"
                rel="noopener noreferrer"
                style={linkStyle}
              >
                Clique aqui e deixe uma nota para o quanto você recomendaria o vaguinhas a alguém.
              </Link>
            </Text>
            
            <Text style={textStyle}>
              Sinta-se livre para nos mandar uma mensagem no{' '}
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
  )
}

export default FeedbackEmail;
