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

interface NewUpdateEmailProps {
  currentYear: string | number;
  useCid?: boolean;
}

const NewUpdateEmail: React.FC<NewUpdateEmailProps> = ({
  currentYear,
  useCid = false
}) => {
  return (
    <Html>
      <Head />
      <Preview>Agora o vaguinhas é ainda mais personalizável! </Preview>
      <Body style={mainStyle}>
        <Container style={containerStyle}>
          {/* Logo Section */}
          <Section style={logoSectionStyle}>
            <Img
              src={useCid ? 'cid:logo@vaguinhas' : 'https://www.vaguinhas.com.br/vaguinhas-logo.png'}
              alt='vaguinhas logo'
              width='200'
              style={logoStyle}
            />
          </Section>

          {/* Heading and Message */}
          <Section style={sectionStyle}>
            <Heading style={headingStyle}>Agora o vaguinhas é ainda mais personalizável! </Heading>

            <Text style={textStyle}>
              Nós lançamos uma nova atualização em 
              <a href='https://vaguinhas.com.br' target='_blank' rel='noopener noreferrer' style={linkStyle}> nosso site</a> que te permite escolher entre receber vagas apenas de frontend, backend, mobile ou design UI/UX!
            </Text>

            <Text style={textStyle}>
              Acesse sua área do assinante e atualize as suas preferências para ter uma experiência ainda mais personalizada.
            </Text>

            <Text style={textStyle}>
              Qualquer dúvida sinta-se livre para nos mandar uma mensagem no{' '}
              <a href='https://linkedin.com/company/vaguinhas' target='_blank' rel='noopener noreferrer' style={linkStyle}>
                LinkedIn
              </a>.
            </Text>

            <Text style={textStyle}>
              Ou junte-se ao nosso servidor no{' '}
              <a href='https://discord.gg/3thzBA5C' target='_blank' rel='noopener noreferrer' style={linkStyle}>
                Discord
              </a>
              , onde nossa comunidade também está ativa! 😊
            </Text>

            {/* <Text style={textStyle}>
              Em breve, tudo estará funcionando normalmente novamente! 😊
            </Text> */}
          </Section>

          {/* Divider and Footer */}
          <Hr style={hrStyle} />
          <Text style={footerStyle}>vaguinhas - {currentYear}</Text>
        </Container>
      </Body>
    </Html>
  );
};

export default NewUpdateEmail;
