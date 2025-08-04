import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Html, Head, Preview, Body, Container, Section, Heading, Text, Hr, Img, } from '@react-email/components';
const ConfirmationEmail = ({ confirmationLink, currentYear, useCid = false, password }) => {
    return (_jsxs(Html, { children: [_jsx(Head, {}), _jsx(Preview, { children: "Obrigado por se cadastrar!" }), _jsx(Body, { style: mainStyle, children: _jsxs(Container, { style: containerStyle, children: [_jsx(Section, { style: logoSectionStyle, children: _jsx(Img, { src: useCid ? "cid:logo@vaguinhas" : "https://www.vaguinhas.com.br/vaguinhas-logo.png", alt: "vaguinhas logo", width: "200", style: logoStyle }) }), _jsxs(Section, { style: sectionStyle, children: [_jsx(Heading, { style: headingStyle, children: "Obrigado por se cadastrar!" }), _jsx(Text, { style: textStyle, children: "Por favor confirme seu e-mail clicando no link abaixo:" }), _jsx(Text, { style: textStyle, children: _jsx("a", { href: confirmationLink, style: linkStyle, children: "Confirmar endere\u00E7o de e-mail" }) }), _jsx(Text, { style: textStyle, children: "Voc\u00EA receber\u00E1 vaguinhas de tecnologia nesse e-mail diariamente. \uD83D\uDE0A" }), _jsxs(Text, { style: textStyle, children: ["Sua senha para acessar a \u00E1rea de assinante \u00E9: ", password] }), _jsx(Text, { style: textStyle, children: "Se voc\u00EA possui alguma d\u00FAvida, sinta-se livre para responder a este e-mail que n\u00F3s iremos lhe ajudar!" }), _jsx(Text, { style: textStyle, children: "Caso n\u00E3o tenha sido voc\u00EA, por favor ignore este e-mail." })] }), _jsx(Hr, { style: hrStyle }), _jsxs(Text, { style: footerStyle, children: ["vaguinhas - ", currentYear] })] }) })] }));
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
const linkStyle = {
    color: '#ff914d',
    textDecoration: 'none',
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
export default ConfirmationEmail;
