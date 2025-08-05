import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Html, Head, Preview, Body, Container, Section, Heading, Text, Hr, Img, } from '@react-email/components';
const AdminNotificationEmail = ({ userEmail, currentYear, useCid = false, }) => {
    return (_jsxs(Html, { children: [_jsx(Head, {}), _jsx(Preview, { children: "Novo cadastro realizado!" }), _jsx(Body, { style: mainStyle, children: _jsxs(Container, { style: containerStyle, children: [_jsx(Section, { style: logoSectionStyle, children: _jsx(Img, { src: useCid ? "cid:logo@vaguinhas" : "https://www.vaguinhas.com.br/vaguinhas-logo.png", alt: "vaguinhas logo", width: "200", style: logoStyle }) }), _jsxs(Section, { style: sectionStyle, children: [_jsx(Heading, { style: headingStyle, children: "Novo cadastro realizado!" }), _jsx(Text, { style: textStyle, children: "O seguinte e-mail foi cadastrado no sistema:" }), _jsx(Text, { style: emailBoxStyle, children: userEmail }), _jsx(Hr, { style: hrStyle }), _jsxs(Text, { style: footerStyle, children: ["Sistema Vaguinhas - ", currentYear] })] })] }) })] }));
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
