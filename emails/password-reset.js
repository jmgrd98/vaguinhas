import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Body, Container, Head, Html, Preview, Section, Text, Button, Hr, Heading, } from '@react-email/components';
export const PasswordResetEmail = ({ resetLink }) => (_jsxs(Html, { children: [_jsx(Head, {}), _jsx(Preview, { children: "Redefini\u00E7\u00E3o de Senha - Vaguinhas" }), _jsx(Body, { style: main, children: _jsxs(Container, { style: container, children: [_jsx(Heading, { style: heading, children: "Redefini\u00E7\u00E3o de Senha" }), _jsx(Text, { style: paragraph, children: "Recebemos uma solicita\u00E7\u00E3o para redefinir sua senha na Vaguinhas." }), _jsx(Text, { style: paragraph, children: "Clique no bot\u00E3o abaixo para criar uma nova senha:" }), _jsx(Section, { style: buttonContainer, children: _jsx(Button, { className: "cursor-pointer", style: button, href: resetLink, children: "Redefinir senha" }) }), _jsx(Text, { style: paragraph, children: "Se voc\u00EA n\u00E3o solicitou esta redefini\u00E7\u00E3o, por favor ignore este e-mail." }), _jsx(Text, { style: paragraph, children: "O link expirar\u00E1 em 1 hora por motivos de seguran\u00E7a." }), _jsx(Hr, { style: hr }), _jsx(Text, { style: footer, children: "Equipe Vaguinhas" })] }) })] }));
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
