// app/api/format-email/route.ts
import { NextRequest, NextResponse } from 'next/server';
import juice from 'juice';


// Add at the top
const baseUrl = process.env.NEXTAUTH_URL || "https://vaguinhas.com.br";

console.log('BASE URL', baseUrl)


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
    let rawHtml: string;
    const email = new URL(request.url).searchParams.get('email') || '';
    
    // Generate unsubscribe token from email
    // (You'll need to implement proper token generation in your subscription flow)
    const unsubscribeToken = email ? btoa(email) : ''; // Simple base64 encoding for demo

    const contentType = request.headers.get('content-type') || '';


   // Handle HTML content
    if (contentType.includes('text/html') || contentType.includes('text/plain')) {
      rawHtml = await request.text();
    } 
    // Unsupported media type
    else {
      return new NextResponse('Unsupported Media Type: Expected HTML', {
        status: 415,
        headers: { 
          'Content-Type': 'text/plain',
          'Accept': 'text/html'
        },
      });
    }

    // Process HTML
    let htmlContent = rawHtml
      .replace(/<h2/g, '<h2 class="job-title"')
      .replace(/<h3/g, '<h3 class="company-name"')
      .replace(/<p>/g, '<p class="job-description">')
      .replace(/<a href/g, '<a class="job-link" href');

    // Process links
    const applyPattern = /apply|vaga|jobs|candidatar|gupy|catho|buscojobs|linkedin|\.io|\.com\/job|careers|recruiting|recruitment|hiring/i;
    const companyPattern = /empresa|company|site|website|coporativo|corp|sobre|\.com$|\.com\/$|\.io$|\.tech$|\.ai$/i;

    htmlContent = htmlContent.replace(
      /<a class="job-link" href="(.*?)">(.*?)<\/a>/g,
      (match: string, href: string, text: string): string => {
        if (applyPattern.test(text) || applyPattern.test(href)) {
          return `<p><a class="apply-button" href="${href}">Ver vaga</a></p>`;
        }
        if (companyPattern.test(text) || companyPattern.test(href)) {
          return `<a class="company-link" href="${href}">Ver empresa</a>`;
        }
        return match;
      }
    );

    // Process paragraphs
    htmlContent = htmlContent.replace(
      /<p class="job-description">([\s\S]*?)<\/p>/g,
      (_: string, content: string): string => {
        const spaced = content.replace(/([^.\s]|^)\.([A-Z])/g, '$1. $2');
        return spaced.trim().split(/(?<=\.)\s+/)
          .filter(s => s.trim().length > 0)
          .map(s => `<p class="job-description">${s.trim()}</p>`)
          .join(' ');
      }
    );

    // Wrap content
    const styledContent = `
      <div class="job-content" style="color: #444444; line-height: 1.5; font-family: Arial, sans-serif;">
        ${htmlContent}
      </div>
    `;

    // Build full email
    let fullEmail = `
      ${EMAIL_TEMPLATE_TOP}
      ${styledContent}
      ${EMAIL_FOOTER}
      ${EMAIL_TEMPLATE_BOTTOM}
    `;
    
    // Add unsubscribe link
    // Then in the POST handler:
     // Add unsubscribe link
    if (unsubscribeToken) {
      fullEmail = fullEmail.replace(
        "{{UNSUBSCRIBE_LINK}}", 
        `${baseUrl}/api/unsubscribe?email=${encodeURIComponent(unsubscribeToken)}`
      );
    } else {
      fullEmail = fullEmail.replace('{{UNSUBSCRIBE_LINK}}', `${baseUrl}/unsubscribe-success`);
    }

    // Inline CSS
    const inlined = juice(fullEmail);

    return new NextResponse(inlined, {
      status: 200,
      headers: { 'Content-Type': 'text/html' },
    });
    
  } catch (error: unknown) {
    console.error('Error processing email:', error);
    
    const errorMessage = error instanceof Error ? 
      error.message : 
      'Unknown error during email processing';
    
    return new NextResponse(`Error: ${errorMessage}`, {
      status: 500,
      headers: { 'Content-Type': 'text/plain' },
    });
  }
}

// GET handler (simplificado)
export async function GET(): Promise<NextResponse> {
  const usage = `
    <!DOCTYPE html>
    <html>
    <head><title>Email Formatting API</title></head>
    <body>
      <h1>Usage Instructions</h1>
      <p>POST JSON: { html: string, unsubscribeToken: string }</p>
      <p>Or POST HTML with token in header (X-Unsubscribe-Token) or query param (?token=)</p>
    </body>
    </html>
  `;

  return new NextResponse(usage, {
    status: 200,
    headers: { 'Content-Type': 'text/html' },
  });
}