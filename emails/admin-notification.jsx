import React from 'react';
import { Html, Head, Preview, Body, Container, Section, Heading, Text, Hr, Img, } from '@react-email/components';
const AdminNotificationEmail = ({ userEmail, currentYear, useCid = false, }) => {
    return (<Html>
      <Head />
      <Preview>Novo cadastro realizado!</Preview>
      <Body style={mainStyle}>
        <Container style={containerStyle}>
          {/* Logo Section */}
          <Section style={logoSectionStyle}>
            <Img src={useCid ? "cid:logo@vaguinhas" : "https://www.vaguinhas.com.br/vaguinhas-logo.png"} alt="vaguinhas logo" width="200" style={logoStyle}/>
          </Section>

          {/* Notification Content */}
          <Section style={sectionStyle}>
            <Heading style={headingStyle}>Novo cadastro realizado!</Heading>
            <Text style={textStyle}>
              O seguinte e-mail foi cadastrado no sistema:
            </Text>
            <Text style={emailBoxStyle}>{userEmail}</Text>
            <Hr style={hrStyle}/>
            <Text style={footerStyle}>Sistema Vaguinhas - {currentYear}</Text>
          </Section>
        </Container>
      </Body>
    </Html>);
};
// Styles
const mainStyle = {
    backgroundColor: '#ffffff',
    margin: '0',
    padding: '0',
    width: '100%',
    fontFamily: 'Arial, sans-serif',
};
const containerStyle = {
    maxWidth: '600px',
    margin: '0 auto',
    padding: '20px',
};
const logoSectionStyle = {
    padding: '20px 0',
    textAlign: 'center',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
};
const logoStyle = {
    height: 'auto',
    width: '200px',
    maxWidth: '100%',
};
const sectionStyle = {
    margin: '0',
    padding: '0',
};
const headingStyle = {
    color: '#ff914d',
    fontSize: '24px',
    marginTop: '0',
};
const textStyle = {
    fontSize: '16px',
    lineHeight: '1.5',
};
const emailBoxStyle = {
    fontSize: '16px',
    lineHeight: '1.5',
    backgroundColor: '#f3f4f6',
    padding: '10px',
    borderRadius: '5px',
    wordBreak: 'break-all',
    marginTop: '10px',
};
const hrStyle = {
    margin: '30px 0',
    border: 'none',
    borderTop: '1px solid #e5e7eb',
};
const footerStyle = {
    fontSize: '12px',
    color: '#6b7280',
};
export default AdminNotificationEmail;
