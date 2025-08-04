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

interface ProblemsEmailProps {
  currentYear: string | number;
  useCid?: boolean;
}

const ProblemsEmail: React.FC<ProblemsEmailProps> = ({
  currentYear,
  useCid = false
}) => {
  return (
    <Html>
      <Head />
      <Preview>Estamos enfrentando alguns problemas técnicos</Preview>
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
            <Heading style={headingStyle}>Pedimos sua compreensão</Heading>

            <Text style={textStyle}>
              Olá,
            </Text>

            <Text style={textStyle}>
              Atualmente estamos enfrentando desafios técnicos relacionados à escalabilidade devido ao grande
              volume de novos usuários que se juntaram à comunidade.
            </Text>

            <Text style={textStyle}>
              Nossa equipe já está trabalhando arduamente para resolver essas questões o mais rápido possível e garantir
              que a experiência seja a melhor possível para você.
            </Text>

            <Text style={textStyle}>
              Agradecemos sua paciência e compreensão durante este período. Caso tenha dúvidas ou precise de suporte,
              sinta-se à vontade para nos contatar pelo{' '}
              <a href='https://linkedin.com/company/vaguinhas' target='_blank' rel='noopener noreferrer' style={linkStyle}>
                LinkedIn
              </a>
            </Text>

            <Text style={textStyle}>
              Ou junte-se ao nosso servidor no{' '}
              <a href='https://discord.gg/3thzBA5C' target='_blank' rel='noopener noreferrer' style={linkStyle}>
                Discord
              </a>
              , onde nossa comunidade também está ativa!
            </Text>

            <Text style={textStyle}>
              Em breve, tudo estará funcionando normalmente novamente! 😊
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

export default ProblemsEmail;
