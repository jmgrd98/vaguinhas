import { NextRequest, NextResponse } from 'next/server';
import juice from 'juice';
import { MongoClient, Db, Collection, WithId, Filter } from 'mongodb';

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI!;
const DB_NAME = process.env.DB_NAME;

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

// Types from the job posting route
type Stack = 'frontend' | 'backend' | 'fullstack' | 'mobile' | 'dados' | 'design';
type SeniorityLevel = 'junior' | 'pleno' | 'senior';
type JobStatus = 'pending' | 'approved' | 'rejected';
type Currency = 'BRL' | 'USD' | 'EUR';
type JobType = 'nacional' | 'internacional';

interface JobPosting {
  linkVaga: string;
  nomeEmpresa: string;
  cambio: Currency;
  tipoVaga: JobType;
  stack: Stack;
  seniorityLevel: SeniorityLevel;
  cargo: string;
  descricao: string;
  createdAt: string;
  status: JobStatus;
  publishedAt?: string;
  updatedAt: string;
}

interface JobQuery extends Filter<JobPosting> {
  status: JobStatus;
  createdAt: { $gte: string };
  stack?: Stack;
  seniorityLevel?: SeniorityLevel;
}

interface DatabaseConnection {
  client: MongoClient;
  db: Db;
}

interface EmailResponse {
  email: string;
  html: string;
  jobsCount: number;
  message: string;
}

// Add at the top
const baseUrl = process.env.NEXTAUTH_URL || "https://vaguinhas.com.br";

// Type guards
function isValidStack(stack: string): stack is Stack {
  return ['frontend', 'backend', 'fullstack', 'mobile', 'dados', 'design'].includes(stack);
}

function isValidSeniorityLevel(level: string): level is SeniorityLevel {
  return ['junior', 'pleno', 'senior'].includes(level);
}

// Database connection function
async function connectToDatabase(): Promise<DatabaseConnection> {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  if (!MONGODB_URI) {
    throw new Error('Please define the MONGODB_URI environment variable');
  }

  const client = await MongoClient.connect(MONGODB_URI);
  const db = client.db(DB_NAME);

  cachedClient = client;
  cachedDb = db;

  return { client, db };
}

function generateEmailTemplateTop(email: string): string {
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
    .job-content {
      margin-bottom: 2rem;
      padding: 1.5rem;
      border: 1px solid #e5e5e5;
      border-radius: 8px;
      background-color: #fafafa;
    }
    
    .job-content h2 {
      color: #333333;
      font-size: 24px;
      margin-bottom: 10px;
      margin-top: 0;
    }
    
    .job-content h3 {
      color: #555555;
      font-size: 18px;
      margin-top: 0;
      margin-bottom: 15px;
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
    
    .job-content .job-meta {
      display: flex;
      gap: 1rem;
      margin: 1rem 0;
      flex-wrap: wrap;
    }
    
    .job-content .job-tag {
      background-color: #e3f2fd;
      color: #1976d2;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: bold;
      text-transform: uppercase;
    }
    
    .job-content .apply-button {
      display: inline-block;
      padding: 12px 20px;
      background-color: #1a73e8;
      color: #ffffff;
      text-decoration: none;
      border-radius: 6px;
      font-weight: bold;
      margin: 1rem 0;
    }
    
    .job-content .apply-button:hover {
      background-color: #1557b0;
      text-decoration: none;
    }
    
    .hired-button {
      background-color: #4CAF50;
      border-radius: 20px;
      padding: 10px 16px;
      color: #ffffff;
      text-decoration: none;
      font-weight: bold;
    }
    
    .hired-button:hover {
      background-color: #3d8b40;
      text-decoration: none;
    }

    .top-buttons-container {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 20px 20px 0;
    }

    .feedback-button {
      display: inline-block;
      background-color: #6c63ff;
      color: #ffffff;
      text-decoration: none;
      font-weight: bold;
      padding: 10px 16px;
      border-radius: 4px;
    }
    
    .feedback-button:hover {
      background-color: #564fee;
      text-decoration: none;
    }

    .jobs-intro {
      text-align: center;
      margin: 2rem 0;
      color: #555;
    }

    .no-jobs {
      text-align: center;
      padding: 2rem;
      color: #666;
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
      
      .top-buttons-container {
        flex-direction: column;
        gap: 1rem;
        text-align: center;
        padding: 15px 15px 0;
      }

      .job-content .job-meta {
        flex-direction: column;
        gap: 0.5rem;
      }
    }
  </style>
</head>
<body>
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f9f9f9; padding: 20px;">
    <tr>
      <td align="center">
        <table role="presentation" class="container" cellpadding="0" cellspacing="0" border="0" width="600">
          <!-- Buttons row -->
          <tr>
            <td class="top-buttons-container">
              <!-- Feedback Button -->
              <a href="${baseUrl}/feedback?email=${encodeURIComponent(email)}" target="_blank" class="feedback-button">
                Deixe-nos sua avaliação ⭐
              </a>
              
              <!-- Hired Button -->
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

// Function to get stack display name
function getStackDisplayName(stack: Stack): string {
  const stackNames: Record<Stack, string> = {
    frontend: 'Frontend',
    backend: 'Backend', 
    fullstack: 'Fullstack',
    mobile: 'Mobile',
    dados: 'Dados',
    design: 'Design'
  };
  return stackNames[stack];
}

// Function to get seniority display name
function getSeniorityDisplayName(level: SeniorityLevel): string {
  const seniorityNames: Record<SeniorityLevel, string> = {
    junior: 'Júnior',
    pleno: 'Pleno',
    senior: 'Sênior'
  };
  return seniorityNames[level];
}

// Function to escape HTML
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Function to format job description safely
function formatJobDescription(description: string): string {
  return description
    .split('\n')
    .map(paragraph => {
      const trimmed = paragraph.trim();
      return trimmed ? `<p>${escapeHtml(trimmed)}</p>` : '';
    })
    .filter(p => p.length > 0)
    .join('');
}

// Function to format job into HTML
function formatJobToHtml(job: WithId<JobPosting>): string {
  const stackName = getStackDisplayName(job.stack);
  const seniorityName = getSeniorityDisplayName(job.seniorityLevel);
  const currencySymbol = job.cambio === 'BRL' ? 'R$' : job.cambio === 'USD' ? '$' : '€';
  const typeLabel = job.tipoVaga === 'internacional' ? 'Internacional' : 'Nacional';

  return `
    <div class="job-content">
      <h2>${escapeHtml(job.cargo)}</h2>
      <h3>${escapeHtml(job.nomeEmpresa)}</h3>
      
      <div class="job-meta">
        <span class="job-tag">${stackName}</span>
        <span class="job-tag">${seniorityName}</span>
        <span class="job-tag">${typeLabel}</span>
        ${job.cambio !== 'BRL' ? `<span class="job-tag">${currencySymbol}</span>` : ''}
      </div>
      
      <div class="job-description">
        ${formatJobDescription(job.descricao)}
      </div>
      
      <a href="${escapeHtml(job.linkVaga)}" target="_blank" class="apply-button">
        Ver Vaga Completa
      </a>
    </div>
  `;
}

export async function POST(request: NextRequest): Promise<NextResponse<EmailResponse | { error: string }>> {
  try {
    const url = new URL(request.url);
    const email = url.searchParams.get('email') || '';
    
    // Generate unsubscribe token from email
    const unsubscribeToken = email ? btoa(email) : '';
    console.log('UNSUBSCRIBE TOKEN', unsubscribeToken);

    // Connect to MongoDB
    const { db } = await connectToDatabase();
    const collection: Collection<JobPosting> = db.collection<JobPosting>('jobs');

    // Get query parameters for filtering
    const { searchParams } = url;
    const days = Math.min(Math.max(1, parseInt(searchParams.get('days') || '1', 10)), 30); // 1-30 days
    const limit = Math.min(Math.max(1, parseInt(searchParams.get('limit') || '20', 10)), 100); // 1-100 jobs
    const stackParam = searchParams.get('stack');
    const seniorityParam = searchParams.get('seniorityLevel');

    // Validate optional parameters
    const stack = stackParam && isValidStack(stackParam) ? stackParam : undefined;
    const seniorityLevel = seniorityParam && isValidSeniorityLevel(seniorityParam) ? seniorityParam : undefined;

    // Calculate date threshold
    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - days);

    // Build query with proper typing
    const query: JobQuery = {
      status: 'approved' as const,
      createdAt: { $gte: dateThreshold.toISOString() }
    };

    if (stack) {
      query.stack = stack;
    }
    if (seniorityLevel) {
      query.seniorityLevel = seniorityLevel;
    }

    // Fetch jobs from MongoDB
    const jobs = await collection
      .find(query as Filter<JobPosting>)
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray() as WithId<JobPosting>[];

    console.log(`Found ${jobs.length} jobs for email`);

    // Generate jobs HTML content
    let jobsHtml = '';
    
    if (jobs.length === 0) {
      jobsHtml = `
        <div class="no-jobs">
          <h2>Nenhuma vaga encontrada hoje</h2>
          <p>Não há novas vagas aprovadas para hoje. Tente novamente amanhã!</p>
        </div>
      `;
    } else {
      // Add intro text
      const dateStr = new Date().toLocaleDateString('pt-BR');
      const jobWord = jobs.length === 1 ? 'vaga' : 'vagas';
      
      jobsHtml = `
        <div class="jobs-intro">
          <h2>Vagas do Dia - ${dateStr}</h2>
          <p>Encontramos ${jobs.length} ${jobWord} para você hoje!</p>
        </div>
      `;
      
      // Add each job
      jobsHtml += jobs.map(formatJobToHtml).join('\n');
    }

    // Build full email
    let fullEmail = `
      ${generateEmailTemplateTop(email)}
      ${jobsHtml}
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

    const response: EmailResponse = { 
      email, 
      html: inlined, 
      jobsCount: jobs.length,
      message: `Email generated with ${jobs.length} jobs`
    };

    return NextResponse.json(response, { status: 200 });

  } catch (error: unknown) {
    console.error('Error processing email:', error);
    
    const errorMessage = error instanceof Error ? 
      error.message : 
      'Unknown error during email processing';
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

// GET handler
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email') || 'test@example.com';
    
    // Create a new URL with the email parameter
    const postUrl = new URL(request.url);
    postUrl.searchParams.set('email', email);
    
    // Create a POST request to ourselves to generate the email
    const postRequest = new NextRequest(postUrl.toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    
    // Generate the email
    const response = await POST(postRequest);
    const data = await response.json() as EmailResponse | { error: string };
    
    if ('html' in data) {
      return new NextResponse(data.html, {
        status: 200,
        headers: { 'Content-Type': 'text/html' },
      });
    }
    
    return NextResponse.json(data, { status: response.status });
    
  } catch (error) {
    console.error('Error in GET handler:', error);
    
    const usage = `
      <!DOCTYPE html>
      <html>
      <head><title>Daily Email API</title></head>
      <body>
        <h1>Daily Email API</h1>
        <p>POST to generate daily email with jobs from database</p>
        <p>Query parameters:</p>
        <ul>
          <li>email: recipient email</li>
          <li>days: number of days to look back (1-30, default: 1)</li>
          <li>limit: max number of jobs (1-100, default: 20)</li>
          <li>stack: filter by stack (frontend|backend|fullstack|mobile|dados|design)</li>
          <li>seniorityLevel: filter by seniority (junior|pleno|senior)</li>
        </ul>
        <p>Example: GET /api/format-daily-email?email=test@example.com&days=2&stack=frontend</p>
      </body>
      </html>
    `;

    return new NextResponse(usage, {
      status: 200,
      headers: { 'Content-Type': 'text/html' },
    });
  }
}