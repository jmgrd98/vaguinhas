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

interface MagicLinkEmailProps {
  magicLink: string;
  currentYear: string | number;
  useCid?: boolean;
}

const MagicLinkEmail: React.FC<MagicLinkEmailProps> = ({
  magicLink,
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
            <Heading style={headingStyle}>Acesse sua conta</Heading>

            {/* Updated link insertion */}
            <Text style={textStyle}>
              <Link
                href={`${magicLink}`}
                target="_blank"
                rel="noopener noreferrer"
                style={linkStyle}
              >
                Clique aqui para acessar sua área do assinante.
              </Link>
            </Text>
            
            <Text style={textStyle}>
              Sinta-se livre para nos mandar uma mensagem no{' '}
              <Link href="https://linkedin.com/company/vaguinhas" target="_blank" rel="noopener noreferrer" style={linkStyle}>
                LinkedIn
              </Link>{' '}
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

export default MagicLinkEmail;
