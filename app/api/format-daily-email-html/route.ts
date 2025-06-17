// app/api/format-email/route.ts
import { NextRequest, NextResponse } from 'next/server';
import juice from 'juice'; // For inlining CSS

// Tipos para os dados de entrada
interface FormatEmailRequest {
  htmlContent: string;
  unsubscribeToken: string;
}

// Constantes para o template do email
const EMAIL_TEMPLATE_TOP = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Vagas do Dia</title>
  <style>
    @media only screen and (max-width: 600px) {
      .container {
        width: 100% !important;
      }
      .content {
        padding: 15px !important;
      }
      .footer-content {
        padding: 15px !important;
      }
      .qr-code {
        max-width: 180px !important;
      }
    }
    
    /* Base styles for job content */
    .job-content h2 {
      color: #333333;
      font-size: 24px;
      margin-bottom: 10px;
    }
    .job-content h3 {
      color: #555555;
      font-size: 18px;
      margin-top: 0;
    }
    .job-content p {
      color: #444444;
      line-height: 1.5;
      margin: 16px 0;
    }
    .job-content a {
      color: #1a73e8;
      text-decoration: none;
    }
    .job-content a:hover {
      text-decoration: underline;
    }
    .job-content .salary {
      font-weight: bold;
      color: #222222;
      margin: 1.5rem 0;
    }
    .job-content .apply-button {
      display: inline-block;
      padding: 10px 16px;
      background-color: #1a73e8;
      color: #ffffff;
      text-decoration: none;
      border-radius: 4px;
      font-weight: bold;
      margin: 1rem 0;
    }
    .job-content .company-link {
      display: inline-block;
      margin: 8px 0;
      color: #1a73e8;
    }
    .apply-button, .company-link {
      cursor: pointer;
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f9f9f9; font-family: Arial, sans-serif; -webkit-text-size-adjust: 100%;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f9f9f9; padding: 20px;">
    <tr>
      <td align="center">
        <table role="presentation" class="container" cellpadding="0" cellspacing="0" border="0" width="600" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 0 10px rgba(0,0,0,0.05);">
          <tr>
            <td align="center" style="padding: 30px 20px 20px;">
              <img src="https://raw.githubusercontent.com/jmgrd98/vaguinhas/main/public/vaguinhas-logo.png" alt="Vaguinhas Logo" width="100" height="auto" style="display: block; margin: 0 auto 20px;" />
            </td>
          </tr>
          <tr>
            <td class="content" style="padding: 0 30px 20px;">
`;

const EMAIL_FOOTER = `
  <div class="footer-content" style="margin-top: 3rem; padding: 1.5rem; border-top: 1px solid #eaeaea; text-align: center; font-family: Arial, sans-serif; color: #333;">
    <p>Essas foram as vaguinhas do dia! Sinta-se livre para responder a esse e-mail se você tiver qualquer dúvida, ou nos dizendo se você conseguiu a vaga. 😊</p>
    
    <p style="margin-top: 1.5rem; font-weight: bold; font-size: 1.1rem;">Gostou das vagas?</p>
    
    <p style="margin: 1rem 0;">
      Então considere fazer uma doação de qualquer valor através do PIX 
      <strong style="background-color: #f0f0f0; padding: 0.2rem 0.5rem; border-radius: 4px;">vaguinhas@vaguinhas.com.br</strong> 
      para ajudar a nos manter online!
    </p>
    
    <p style="margin-bottom: 1rem;">Ou escaneie o QR Code abaixo:</p>
    
    <img 
      src="https://raw.githubusercontent.com/jmgrd98/vaguinhas/main/public/qrcode-pix.png" 
      alt="QR Code para doação PIX" 
      width="200"
      height="200"
      class="qr-code"
      style="max-width: 200px; margin: 0 auto; display: block; border: 1px solid #ddd; border-radius: 8px;"
    >
    
    <p style="color: #888; font-size: 0.9rem; margin-top: 0.5rem;">
      Se o QR Code não aparecer, utilize o endereço PIX: vaguinhas@vaguinhas.com.br
    </p>

    <!-- Link de unsubscribe -->
    <p style="text-align: center; font-size: 0.8rem; color: #999; margin-top: 1.5rem;">
      <a href="{{UNSUBSCRIBE_LINK}}" style="color: #999; text-decoration: underline;">
        Não quer mais receber nossos e-mails? Cancelar inscrição
      </a>
    </p>
  </div>
`;

const EMAIL_TEMPLATE_BOTTOM = `
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Recebe e valida os dados de entrada
    const requestBody: unknown = await request.json();
    
    // Validação de tipo para os dados de entrada
    if (
      !requestBody || 
      typeof requestBody !== 'object' || 
      !('htmlContent' in requestBody) || 
      !('unsubscribeToken' in requestBody) ||
      typeof (requestBody as FormatEmailRequest).htmlContent !== 'string' ||
      typeof (requestBody as FormatEmailRequest).unsubscribeToken !== 'string'
    ) {
      return new NextResponse('Invalid request format. Expected { htmlContent: string, unsubscribeToken: string }', {
        status: 400,
        headers: { 'Content-Type': 'text/plain' },
      });
    }
    
    const { htmlContent, unsubscribeToken } = requestBody as FormatEmailRequest;

    // Processa o conteúdo HTML
    let processedHtml = htmlContent
      .replace(/<h2/g, '<h2 class="job-title"')
      .replace(/<h3/g, '<h3 class="company-name"')
      .replace(/<p>/g, '<p class="job-description">')
      .replace(/<a href/g, '<a class="job-link" href');
    
    // Substitui links da empresa
    processedHtml = processedHtml.replace(
      /<a class="job-link" href="(.*?)">(.*?)<\/a>/g,
      (match: string, href: string, text: string): string => {
        const applyKeywords = ['apply', 'vaga', 'jobs', 'candidatar', 'gupy', 'catho', 'buscojobs', 'linkedin'];
        if (applyKeywords.some(keyword => text.toLowerCase().includes(keyword))) {
          return match;
        }
        return `<a class="company-link" href="${href}">Ver empresa</a>`;
      }
    );
    
    // Substitui links de candidatura
    processedHtml = processedHtml.replace(
      /<a class="job-link" href="(.*?)">(.*?)<\/a>/g,
      (match: string, href: string, text: string): string => {
        const applyKeywords = ['http', 'apply', 'vaga', 'jobs', 'candidatar', 'gupy', 'catho', 'buscojobs', 'linkedin'];
        if (applyKeywords.some(keyword => text.toLowerCase().includes(keyword))) {
          return `<p><a class="apply-button" href="${href}">Ver vaga</a></p>`;
        }
        return match;
      }
    );

    // Formata parágrafos de descrição
    processedHtml = processedHtml.replace(
      /<p class="job-description">([\s\S]*?)<\/p>/g,
      (_: string, content: string): string => {
        const spacedContent = content.replace(
          /([^.\s]|^)\.([A-Z])/g, 
          '$1. $2'
        );
        
        const sentences = spacedContent
          .trim()
          .split(/(?<=\.)\s+/)
          .filter(Boolean);
        
        return sentences
          .map(sent => `<p class="job-description">${sent.trim()}</p>`)
          .join(' ');
      }
    );
    
    // Cria o conteúdo estilizado
    const styledContent = `
      <div class="job-content" style="color: #444444; line-height: 1.5; font-family: Arial, sans-serif;">
        ${processedHtml}
      </div>
    `;

    // Constroi o link de unsubscribe
    const unsubscribeLink = `https://vaguinhas.com.br/api/unsubscribe?token=${unsubscribeToken}`;
    
    // Atualiza o footer com o link
    const fullFooter = EMAIL_FOOTER.replace('{{UNSUBSCRIBE_LINK}}', unsubscribeLink);

    // Combina todas as partes do email
    const formattedEmail = `
      ${EMAIL_TEMPLATE_TOP}
      ${styledContent}
      ${fullFooter}
      ${EMAIL_TEMPLATE_BOTTOM}
    `;

    // Aplica CSS inline para compatibilidade
    const inlinedEmail = juice(formattedEmail);
    
    return new NextResponse(inlinedEmail, {
      status: 200,
      headers: { 'Content-Type': 'text/html' },
    });
  } catch (error: unknown) {
    console.error('Error processing email:', error);
    
    const errorMessage = error instanceof Error ? 
      error.message : 
      'Unknown error occurred during email processing';
    
    return new NextResponse(`Error processing HTML content: ${errorMessage}`, {
      status: 500,
      headers: { 'Content-Type': 'text/plain' },
    });
  }
}

// GET handler for usage instructions
export async function GET(): Promise<NextResponse> {
  const usage = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Email Formatting Service</title>
    </head>
    <body style="font-family: Arial, sans-serif; padding: 20px;">
      <h1>Email Formatting API</h1>
      <p>Send a POST request with JSON payload to this endpoint to format it as a Vaguinhas email.</p>
      
      <h2>Example using curl:</h2>
      <pre style="background-color: #f5f5f5; padding: 15px; border-radius: 5px;">
curl -X POST \\
  -H "Content-Type: application/json" \\
  --data '{
    "htmlContent": "<h2>Desenvolvedor Front-end</h2><h3>Empresa FC</h3><p><a href=\\"https://example.com\\">Ver site da empresa</a></p><p><strong>Requisitos:</strong><br>- React, Next.js<br>- TypeScript</p><p class=\\"salary\\">Faixa Salarial: R$8.000,00 – R$9.000,00</p><p><a class=\\"apply-button\\" href=\\"https://example.com/job\\">Ver vaga</a></p>",
    "unsubscribeToken": "seu_token_unico_aqui"
  }' \\
  http://localhost:3000/api/format-email
      </pre>
      
      <h2>Required Parameters:</h2>
      <ul>
        <li><strong>htmlContent</strong>: Raw HTML content of the jobs</li>
        <li><strong>unsubscribeToken</strong>: Unique token for the unsubscribe link</li>
      </ul>
      
      <h2>Features:</h2>
      <ul>
        <li>Wraps content in professional email template</li>
        <li>Appends donation footer with QR code</li>
        <li>Applies consistent styling to all elements</li>
        <li>Responsive design for all devices</li>
        <li>Adds Vaguinhas branding</li>
        <li>Converts company links to "Ver empresa"</li>
        <li>Converts apply links to "Ver vaga" buttons</li>
        <li>Includes unsubscribe link with unique token</li>
      </ul>
    </body>
    </html>
  `;

  return new NextResponse(usage, {
    status: 200,
    headers: { 'Content-Type': 'text/html' },
  });
}