import { NextRequest, NextResponse } from 'next/server';
import juice from 'juice';
import { Collection, WithId } from 'mongodb';
import { JobPosting } from '../post-a-job/route';
import { connectToDatabase } from '@/lib/mongodb';

// Add at the top
const baseUrl = process.env.NEXTAUTH_URL || "https://vaguinhas.com.br";

async function getJobsFromMongo() {
  const { db } = await connectToDatabase();
  const collection: Collection<JobPosting> = db.collection<JobPosting>('jobs');
  
  return collection.find().toArray();
}

function formatJobPostingToHtml(job: WithId<JobPosting>): string {
  return `
    <div class="job-content" style="color: #444444; line-height: 1.5; font-family: Arial, sans-serif; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 1px solid #eaeaea;">
      <h2 class="job-title">${job.cargo}</h2>
      <h3 class="company-name">${job.nomeEmpresa}</h3>
      
      <p class="job-description"><strong>Tipo:</strong> ${job.tipoVaga}</p>
      <p class="job-description"><strong>Nível:</strong> ${job.seniorityLevel}</p>
      <p class="job-description"><strong>Stack:</strong> ${job.stack}</p>
      <p class="job-description"><strong>Câmbio:</strong> ${job.cambio}</p>
      
      <p class="job-description">${job.descricao}</p>
      
      <p><a class="apply-button" href="${job.linkVaga}" target="_blank">Ver vaga</a></p>
      
      <p style="font-size: 0.9rem; color: #888; margin-top: 15px;">
        Publicado em: ${new Date(job.createdAt).toLocaleDateString('pt-BR')}
      </p>
    </div>
  `;
}

function generateEmailTemplateTop(email: string) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Vagas do Dia</title>
  <style>
    /* Base styles */
    body {
      margin: 0;
      padding: 0;
      background-color: #f9f9f9;
      font-family: Arial, sans-serif;
      -webkit-text-size-adjust: 100%;
    }
    
    .container {
      width: 600px;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 0 10px rgba(0,0,0,0.05);
    }
    
    .content {
      padding: 0 30px 20px;
    }
    
    .footer-content {
      margin-top: 3rem;
      padding: 1.5rem;
      border-top: 1px solid #eaeaea;
      text-align: center;
      font-family: Arial, sans-serif;
      color: #333;
    }
    
    .qr-code {
      max-width: 200px;
      margin: 0 auto;
      display: block;
      border: 1px solid #ddd;
      border-radius: 8px;
    }
    
    /* Job content styles */
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
    
    .job-content .apply-button, .hired-button, .feedback-button {
      display: inline-block;
      padding: 10px 16px;
      background-color: #1a73e8;
      color: #ffffff;
      text-decoration: none;
      border-radius: 4px;
      font-weight: bold;
      margin: 1rem 0;
    }
    
    .hired-button {
      background-color: #4CAF50;
      border-radius: 20px;
    }
    
    .hired-button:hover {
      background-color: #3d8b40;
      text-decoration: none;
    }
    
    .hired-button-container {
      text-align: right;
      padding: 20px 20px 0;
    }
    
    .job-content .company-link {
      display: inline-block;
      margin: 8px 0;
      color: #1a73e8;
    }
    
    .apply-button, .company-link {
      cursor: pointer;
    }

    .top-buttons-container {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

      .feedback-button {
        display: inline-block;
        background-color: #6c63ff;
        color: #ffffff;
        text-decoration: none;
        font-weight: bold;
      }
      
      .feedback-button:hover {
        background-color: #564fee;
        text-decoration: none;
      }

    .section-title {
      color: #333333;
      font-size: 28px;
      margin: 30px 0 20px 0;
      padding-bottom: 10px;
      border-bottom: 2px solid #1a73e8;
      text-align: center;
    }
    
    /* Media queries */
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
      
      .hired-button-container {
        text-align: center;
        padding: 15px 15px 0;
      }
      
      .hired-button {
        display: block;
        margin: 0 auto;
      }
    }
  </style>
</head>
<body>
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f9f9f9; padding: 20px;">
    <tr>
      <td align="center">
        <table role="presentation" class="container" cellpadding="0" cellspacing="0" border="0" width="600">
          <!-- Hired button row -->
         
         <tr>
            <td class="top-buttons-container">
              <!-- New Feedback Button -->
              <a href="${baseUrl}/feedback?email=${encodeURIComponent(email)}" target="_blank" class="feedback-button">
                Deixe-nos sua avaliação ⭐
              </a>
              
              <!-- Existing Hired Button -->
              <a href="${baseUrl}/consegui-uma-vaga?email=${encodeURIComponent(email)}" target="_blank" class="hired-button">
                Consegui uma vaga! 🎉
              </a>
            </td>
          </tr>
       
          
          <!-- Logo row -->
          <tr>
            <td align="center" style="padding: 30px 20px 20px;">
              <img src="https://raw.githubusercontent.com/jmgrd98/vaguinhas/main/public/vaguinhas-logo.png" alt="Vaguinhas Logo" width="100" height="auto" style="display: block; margin: 0 auto 20px;" />
            </td>
          </tr>
          
          <!-- Content row -->
          <tr>
            <td class="content">
`;
}

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
    const unsubscribeToken = email ? btoa(email) : '';
    console.log('UNSUBSCRIBE TOKEN', unsubscribeToken)
    const contentType = request.headers.get('content-type') || '';

    // Get jobs from MongoDB
    const mongoJobs = await getJobsFromMongo();
    console.log('Retrieved', mongoJobs.length, 'jobs from MongoDB');

    // Format MongoDB jobs to HTML
    const mongoJobsHtml = mongoJobs.length > 0 ? `
      <h1 class="section-title">🎯 Vagas em Destaque</h1>
      ${mongoJobs.map(job => formatJobPostingToHtml(job)).join('')}
    ` : '';

    // Handle HTML content from POST request
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

    // Process HTML from POST request
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

    // Wrap POST request content
    const postRequestContent = rawHtml.trim() ? `
      <h1 class="section-title">📧 Vagas Recebidas</h1>
      <div class="job-content" style="color: #444444; line-height: 1.5; font-family: Arial, sans-serif;">
        ${htmlContent}
      </div>
    ` : '';

    // Combine MongoDB jobs + POST request content
    const combinedContent = mongoJobsHtml + postRequestContent;

    // Build full email
    let fullEmail = `
      ${generateEmailTemplateTop(email)}
      ${combinedContent}
      ${EMAIL_FOOTER}
      ${EMAIL_TEMPLATE_BOTTOM}
    `;
    
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

    return NextResponse.json({ 
      email, 
      html: inlined,
      mongoJobsCount: mongoJobs.length,
      hasPostContent: rawHtml.trim().length > 0
    }, { status: 200 });
    
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