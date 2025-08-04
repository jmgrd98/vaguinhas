import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Html, Head, Preview, Body, Container, Section, Heading, Text, Hr, Img, } from '@react-email/components';
const SupportUsEmail = ({ currentYear, pixKey = 'vaguinhas@vaguinhas.com.br', }) => {
    return (_jsxs(Html, { children: [_jsx(Head, {}), _jsx(Preview, { children: "N\u00F3s precisamos do seu apoio!" }), _jsx(Body, { style: mainStyle, children: _jsxs(Container, { style: containerStyle, children: [_jsx(Section, { style: logoSectionStyle, children: _jsx(Img, { src: 'https://www.vaguinhas.com.br/vaguinhas-logo.png', 
                                // src={`${baseURL}/public/static/vaguinhas-logo.png`}
                                alt: "vaguinhas logo", width: "200", style: logoStyle }) }), _jsxs(Section, { style: sectionStyle, children: [_jsx(Heading, { style: headingStyle, children: "N\u00F3s precisamos do seu apoio!" }), _jsx(Text, { style: textStyle, children: "Nossa opera\u00E7\u00E3o custa dinheiro e para continuar te mandando vaguinhas de forma gratuita, n\u00F3s precisamos de fontes de renda alternativas." }), _jsxs(Text, { style: textStyle, children: ["Considere fazer uma doa\u00E7\u00E3o de qualquer valor atrav\u00E9s do PIX ", _jsx("strong", { children: pixKey }), " para ajudar a nos manter online."] })] }), _jsxs(Section, { style: pixSectionStyle, children: [_jsx(Text, { style: textStyle, children: "Escaneie este QR Code para fazer uma doa\u00E7\u00E3o via PIX:" }), _jsx(Img, { src: 'https://www.vaguinhas.com.br/qrcode-pix.png', 
                                    // src={`${baseURL}/public/static/qrcode-pix.png`}
                                    alt: "QR Code PIX", width: "180", height: "180", style: pixQrStyle }), _jsxs(Section, { style: pixInfoStyle, children: [_jsxs(Text, { style: textStyle, children: [_jsx("strong", { children: "Chave PIX:" }), " ", pixKey] }), _jsx(Text, { style: smallTextStyle, children: "Ou copie a chave e cole em seu aplicativo banc\u00E1rio" })] })] }), _jsxs(Section, { style: sectionStyle, children: [_jsxs(Text, { style: textStyle, children: ["Se voc\u00EA gostou das vaguinhas ou se possui alguma d\u00FAvita, sinta-se livre para nos chamar no", ' ', _jsx("a", { href: "https://linkedin.com/company/vaguinhas", target: "_blank", rel: "noopener noreferrer", style: linkStyle, children: "LinkedIn" }), ' ', "para levar uma ideia! \uD83D\uDE0A"] }), _jsx(Text, { style: textStyle, children: "Caso n\u00E3o tenha sido voc\u00EA, por favor ignore este e-mail." })] }), _jsx(Hr, { style: hrStyle }), _jsxs(Text, { style: footerStyle, children: ["vaguinhas - ", currentYear] })] }) })] }));
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
const pixSectionStyle = {
    textAlign: 'center',
    margin: '25px 0',
    padding: '20px',
    backgroundColor: '#f8f9fa',
    borderRadius: '12px',
};
const pixQrStyle = {
    width: '180px',
    height: '180px',
    display: 'block',
    margin: '10px auto',
};
const pixInfoStyle = {
    marginTop: '20px',
};
const smallTextStyle = {
    fontSize: '14px',
    color: '#6b7280',
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
export default SupportUsEmail;
