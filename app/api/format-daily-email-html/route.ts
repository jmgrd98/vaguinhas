// app/api/format-email/route.ts
import { NextRequest, NextResponse } from 'next/server';
import juice from 'juice'; // For inlining CSS

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

    <!-- NOVO: link de unsubscribe -->
    <p style="margin-top: 1rem; font-size: 0.8rem; color: #999;">
      <a href="https://www.vaguinhas.com.br/api/unsubscribe" style="color: #999; text-decoration: none;">
        Cancelar inscrição
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

export async function POST(request: NextRequest) {
  try {
    let htmlContent = await request.text();
    
    // Add CSS classes to job content
    htmlContent = htmlContent
      .replace(/<h2/g, '<h2 class="job-title"')
      .replace(/<h3/g, '<h3 class="company-name"')
      .replace(/<p>/g, '<p class="job-description">')
      .replace(/<a href/g, '<a class="job-link" href');
    
    // Replace company website links with "Ver empresa"
    htmlContent = htmlContent.replace(
      /<a class="job-link" href="(.*?)">(.*?)<\/a>/g,
      (match, href, text) => {
        // Skip apply links that should become "Ver vaga"
        if (text.includes('apply') || text.includes('vaga') || 
            text.includes('jobs') || text.includes('candidatar') ||
            text.includes('gupy') || text.includes('catho') ||
            text.includes('buscojobs') || text.includes('linkedin')) {
          return match;
        }
        return `<a class="company-link" href="${href}">Ver empresa</a>`;
      }
    );
    
    // Replace apply URLs with "Ver vaga" button
    htmlContent = htmlContent.replace(
      /<a class="job-link" href="(.*?)">(.*?)<\/a>/g,
      (match, href, text) => {
        // Check if this is likely an apply link
        if (text.includes('http') || text.includes('apply') || 
            text.includes('vaga') || text.includes('jobs') || 
            text.includes('candidatar') || text.includes('gupy') ||
            text.includes('catho') || text.includes('buscojobs') ||
            text.includes('linkedin')) {
          return `<p><a class="apply-button" href="${href}">Ver vaga</a></p>`;
        }
        return match;
      }
    );

    htmlContent = htmlContent.replace(
      /<p class="job-description">([\s\S]*?)<\/p>/g,
      (_, content) => {
        // Add space after sentence-ending dots missing a space
        const spacedContent = content.replace(
          /([^.\s]|^)\.([A-Z])/g, 
          '$1. $2'
        );

        // Split into sentences using existing space-based logic
        const sentences = spacedContent.trim().split(/(?<=\.)\s+/);
        
        return sentences
          .filter(Boolean)
          .map((sent: string) => `<p class="job-description">${sent.trim()}</p>`)
          .join(' ');
      }
    );
    
    // Wrap the job content in a styled container
    const styledContent = `
      <div class="job-content" style="color: #444444; line-height: 1.5; font-family: Arial, sans-serif;">
        ${htmlContent}
      </div>
    `;

    // Combine all parts
    const formattedEmail = `
      ${EMAIL_TEMPLATE_TOP}
      ${styledContent}
      ${EMAIL_FOOTER}
      ${EMAIL_TEMPLATE_BOTTOM}
    `;

    // Inline CSS for email compatibility
    const inlinedEmail = juice(formattedEmail);
    return new NextResponse(inlinedEmail, {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
      },
    });
  } catch (error) {
    console.error('Error processing email:', error);
    return new NextResponse('Error processing HTML content', {
      status: 500,
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  }
}

// GET handler for usage instructions
export async function GET() {
  const usage = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Email Formatting Service</title>
    </head>
    <body style="font-family: Arial, sans-serif; padding: 20px;">
      <h1>Email Formatting API</h1>
      <p>Send a POST request with raw HTML content to this endpoint to format it as a Vaguinhas email.</p>
      
      <h2>Example using curl:</h2>
      <pre style="background-color: #f5f5f5; padding: 15px; border-radius: 5px;">
curl -X POST \\
  -H "Content-Type: text/html" \\
  --data "&lt;h2&gt;Desenvolvedor Front-end&lt;/h2&gt;
          &lt;h3&gt;Empresa FC&lt;/h3&gt;
          &lt;p&gt;&lt;a href='https://example.com'&gt;Ver site da empresa&lt;/a&gt;&lt;/p&gt;
          &lt;p&gt;&lt;strong&gt;Requisitos:&lt;/strong&gt;&lt;br&gt;
          - React, Next.js&lt;br&gt;
          - TypeScript&lt;/p&gt;
          &lt;p class='salary'&gt;Faixa Salarial: R$8.000,00 – R$9.000,00&lt;/p&gt;
          &lt;p&gt;&lt;a class='apply-button' href='https://example.com/job'&gt;Ver vaga&lt;/a&gt;&lt;/p&gt;" \\
  http://localhost:3000/api/format-email
      </pre>
      
      <h2>Features:</h2>
      <ul>
        <li>Wraps content in professional email template</li>
        <li>Appends donation footer with QR code</li>
        <li>Applies consistent styling to all elements</li>
        <li>Responsive design for all devices</li>
        <li>Adds Vaguinhas branding</li>
        <li>Converts company links to "Ver empresa"</li>
        <li>Converts apply links to "Ver vaga" buttons</li>
      </ul>
    </body>
    </html>
  `;

  return new NextResponse(usage, {
    status: 200,
    headers: {
      'Content-Type': 'text/html',
    },
  });
}