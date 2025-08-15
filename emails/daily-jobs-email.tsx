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
//   Hr,
  Img,
  Link,
} from '@react-email/components';
import { JobPosting } from '@/app/api/post-a-job/route';
import { WithId } from 'mongodb';

interface JobEmailProps {
  email: string;
  jobs: WithId<JobPosting>[];
  baseUrl?: string;
  additionalContent?: string;
}

// Styles
const mainStyle = {
  backgroundColor: '#f9f9f9',
  fontFamily: 'Arial, sans-serif',
};

const containerStyle = {
  width: '600px',
  backgroundColor: '#ffffff',
  borderRadius: '8px',
  overflow: 'hidden',
  boxShadow: '0 0 10px rgba(0,0,0,0.05)',
  margin: '20px auto',
};

const logoSectionStyle = {
  textAlign: 'center' as const,
  padding: '30px 20px 20px',
};

const logoStyle = {
  display: 'block',
  margin: '0 auto 20px',
};

const buttonContainerStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '20px',
  width: '100%',
};

const feedbackButtonStyle = {
  backgroundColor: '#6c63ff',
  color: '#ffffff',
  padding: '10px 16px',
  borderRadius: '4px',
  textDecoration: 'none',
  fontWeight: 'bold',
  display: 'inline-block',
};

const hiredButtonStyle = {
  backgroundColor: '#4CAF50',
  color: '#ffffff',
  padding: '10px 16px',
  borderRadius: '20px',
  textDecoration: 'none',
  fontWeight: 'bold',
  display: 'inline-block',
};

const contentStyle = {
  padding: '0 30px 20px',
};

const jobContentStyle = {
  color: '#444444',
  lineHeight: '1.5',
  fontFamily: 'Arial, sans-serif',
  marginBottom: '30px',
  paddingBottom: '20px',
  borderBottom: '1px solid #eaeaea',
};

const jobTitleContainerStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  marginBottom: '10px',
};

const jobTitleStyle = {
  color: '#333333',
  fontSize: '24px',
  margin: '0',
};

const featuredBadgeStyle = {
  backgroundColor: '#ffd700',
  color: '#333',
  padding: '4px 8px',
  borderRadius: '12px',
  fontSize: '0.8rem',
  fontWeight: 'bold',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '4px',
  whiteSpace: 'nowrap' as const,
};

const companyNameStyle = {
  color: '#555555',
  fontSize: '18px',
  marginTop: '0',
};

const jobInfoStyle = {
  color: '#444444',
  lineHeight: '1.5',
  margin: '16px 0',
};

const applyButtonStyle = {
  backgroundColor: '#1a73e8',
  color: '#ffffff',
  padding: '10px 16px',
  borderRadius: '4px',
  textDecoration: 'none',
  fontWeight: 'bold',
  display: 'inline-block',
  margin: '1rem 0',
};

const publishedDateStyle = {
  fontSize: '0.9rem',
  color: '#888',
  marginTop: '15px',
};

const footerStyle = {
  marginTop: '3rem',
  padding: '1.5rem',
  borderTop: '1px solid #eaeaea',
  textAlign: 'center' as const,
  fontFamily: 'Arial, sans-serif',
  color: '#333',
};

const qrCodeStyle = {
  maxWidth: '200px',
  margin: '0 auto',
  display: 'block',
  border: '1px solid #ddd',
  borderRadius: '8px',
};

const pixHighlightStyle = {
  backgroundColor: '#f0f0f0',
  padding: '0.2rem 0.5rem',
  borderRadius: '4px',
  fontWeight: 'bold',
};

const unsubscribeStyle = {
  textAlign: 'center' as const,
  fontSize: '0.8rem',
  color: '#999',
  marginTop: '1.5rem',
};

const JobEmailTemplate: React.FC<JobEmailProps> = ({
  email,
  jobs,
  baseUrl = "https://vaguinhas.com.br",
  
}) => {
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const unsubscribeToken = email ? Buffer.from(email).toString('base64') : '';

  return (
    <Html>
      <Head />
      <Preview>Vagas do Dia - Vaguinhas</Preview>
      <Body style={mainStyle}>
        <Container style={containerStyle}>
          {/* Top Buttons */}
          <Section style={buttonContainerStyle}>
            <Link
              href={`${baseUrl}/feedback?email=${encodeURIComponent(email)}`}
              style={feedbackButtonStyle}
            >
              Deixe-nos sua avaliação ⭐
            </Link>
            
            <Link
              href={`${baseUrl}/consegui-uma-vaga?email=${encodeURIComponent(email)}`}
              style={hiredButtonStyle}
            >
              Consegui uma vaga! 🎉
            </Link>
          </Section>

          {/* Logo Section */}
          <Section style={logoSectionStyle}>
            <Img
              src="https://raw.githubusercontent.com/jmgrd98/vaguinhas/main/public/vaguinhas-logo.png"
              alt="Vaguinhas Logo"
              width={100}
              style={logoStyle}
            />
          </Section>

          {/* Content Section */}
          <Section style={contentStyle}>
            {/* MongoDB Jobs */}
            {jobs.map((job) => (
              <Section key={job._id.toString()} style={jobContentStyle}>
                <div style={jobTitleContainerStyle}>
                  <Heading as="h2" style={jobTitleStyle}>{job.cargo}</Heading>
                  <Text style={featuredBadgeStyle}>
                    ⭐ vaga em destaque
                  </Text>
                </div>
                
                <Heading as="h3" style={companyNameStyle}>{job.nomeEmpresa}</Heading>
                
                <Text style={jobInfoStyle}>
                  <strong>Tipo:</strong> {job.tipoVaga}
                </Text>
                <Text style={jobInfoStyle}>
                  <strong>Nível:</strong> {job.seniorityLevel}
                </Text>
                <Text style={jobInfoStyle}>
                  <strong>Stack:</strong> {job.stack}
                </Text>
                <Text style={jobInfoStyle}>
                  <strong>Câmbio:</strong> {job.cambio}
                </Text>
                
                <Text style={jobInfoStyle}>{job.descricao}</Text>
                
                <Text>
                  <Link
                    href={job.linkVaga}
                    style={applyButtonStyle}
                  >
                    Ver vaga
                  </Link>
                </Text>
                
                <Text style={publishedDateStyle}>
                  Publicado em: {formatDate(job.createdAt)}
                </Text>
              </Section>
            ))}
          </Section>

          {/* Footer */}
          <Section style={footerStyle}>
            <Text>
              Essas foram as vaguinhas do dia! Sinta-se livre para responder a esse e-mail 
              se você tiver qualquer dúvida, ou nos dizendo se você conseguiu a vaga. 😊
            </Text>
            
            <Text style={{ marginTop: '1.5rem', fontWeight: 'bold', fontSize: '1.1rem' }}>
              Gostou das vagas?
            </Text>
            
            <Text style={{ margin: '1rem 0' }}>
              Então considere fazer uma doação de qualquer valor através do PIX{' '}
              <Text style={pixHighlightStyle}>vaguinhas@vaguinhas.com.br</Text>{' '}
              para ajudar a nos manter online!
            </Text>
            
            <Text style={{ marginBottom: '1rem' }}>
              Ou escaneie o QR Code abaixo:
            </Text>
            
            <Img
              src="https://raw.githubusercontent.com/jmgrd98/vaguinhas/main/public/qrcode-pix.png"
              alt="QR Code para doação PIX"
              width={200}
              height={200}
              style={qrCodeStyle}
            />
            
            <Text style={{ color: '#888', fontSize: '0.9rem', marginTop: '0.5rem' }}>
              Se o QR Code não aparecer, utilize o endereço PIX: vaguinhas@vaguinhas.com.br
            </Text>

            {/* Unsubscribe Link */}
            <Text style={unsubscribeStyle}>
              <Link
                href={`${baseUrl}/api/unsubscribe?email=${encodeURIComponent(unsubscribeToken)}`}
                style={{ color: '#999', textDecoration: 'underline' }}
              >
                Não quer mais receber nossos e-mails? Cancelar inscrição
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default JobEmailTemplate;