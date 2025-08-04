import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Html, Head, Preview, Body, Container, Section, Heading, Text, Hr, Img, } from '@react-email/components';
const ConfirmEmailReminder = ({ confirmationLink, currentYear, useCid = false, }) => {
    return (_jsxs(Html, { children: [_jsx(Head, {}), _jsx(Preview, { children: "Voc\u00EA esqueceu de confirmar seu e-mail?" }), _jsx(Body, { style: mainStyle, children: _jsxs(Container, { style: containerStyle, children: [_jsx(Section, { style: logoSectionStyle, children: _jsx(Img, { src: useCid ? "cid:logo@vaguinhas" : "https://www.vaguinhas.com.br/vaguinhas-logo.png", alt: "vaguinhas logo", width: "200", style: logoStyle }) }), _jsxs(Section, { style: sectionStyle, children: [_jsx(Heading, { style: headingStyle, children: "Voc\u00EA esqueceu de confirmar seu e-mail?" }), _jsx(Text, { style: textStyle, children: "Voc\u00EA se inscreveu para receber vaguinhas mas esqueceu de confirmar seu e-mail? \uD83E\uDD14" }), _jsxs(Text, { style: textStyle, children: [_jsx("a", { href: confirmationLink, style: linkStyle, children: "Clique aqui" }), ' ', "para confirmar seu e-mail para come\u00E7ar a receber vaguinhas de tecnologia! \uD83D\uDE80"] }), _jsxs(Text, { style: textStyle, children: ["Se voc\u00EA gostou das vaguinhas ou se possui alguma d\u00FAvida, sinta-se livre para nos chamar no", ' ', _jsx("a", { href: "https://linkedin.com/company/vaguinhas", target: "_blank", rel: "noopener noreferrer", style: linkStyle, children: "LinkedIn" }), ' ', "para levar uma ideia! \uD83D\uDE0A"] })] }), _jsx(Hr, { style: hrStyle }), _jsxs(Text, { style: footerStyle, children: ["vaguinhas - ", currentYear] })] }) })] }));
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
export default ConfirmEmailReminder;
