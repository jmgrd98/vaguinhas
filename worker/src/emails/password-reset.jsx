import React from 'react';
import { Body, Container, Head, Html, Preview, Section, Text, Button, Hr, Heading, } from '@react-email/components';
export const PasswordResetEmail = ({ resetLink }) => (<Html>
    <Head />
    <Preview>Redefinição de Senha - Vaguinhas</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={heading}>Redefinição de Senha</Heading>
        
        <Text style={paragraph}>
          Recebemos uma solicitação para redefinir sua senha na Vaguinhas.
        </Text>
        
        <Text style={paragraph}>
          Clique no botão abaixo para criar uma nova senha:
        </Text>
        
        <Section style={buttonContainer}>
          <Button className="cursor-pointer" style={button} href={resetLink}>
            Redefinir senha
          </Button>
        </Section>
        
        <Text style={paragraph}>
          Se você não solicitou esta redefinição, por favor ignore este e-mail.
        </Text>
        
        <Text style={paragraph}>
          O link expirará em 1 hora por motivos de segurança.
        </Text>
        
        <Hr style={hr}/>
        
        <Text style={footer}>
          Equipe Vaguinhas
        </Text>
      </Container>
    </Body>
  </Html>);
// Styles
const main = {
    backgroundColor: '#ffffff',
    fontFamily: 'Arial, sans-serif',
};
const container = {
    margin: '0 auto',
    padding: '20px',
    maxWidth: '600px',
};
const heading = {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#ff914d',
    margin: '20px 0',
};
const paragraph = {
    fontSize: '16px',
    lineHeight: '1.5',
    color: '#333333',
    margin: '10px 0',
};
const buttonContainer = {
    textAlign: 'center',
    margin: '20px 0',
};
const button = {
    backgroundColor: '#ff914d',
    color: '#ffffff',
    fontSize: '16px',
    fontWeight: 'bold',
    padding: '12px 24px',
    borderRadius: '4px',
    textDecoration: 'none',
};
const hr = {
    border: 'none',
    borderTop: '1px solid #eaeaea',
    margin: '20px 0',
};
const footer = {
    fontSize: '14px',
    color: '#666666',
    textAlign: 'center',
    marginTop: '20px',
};
