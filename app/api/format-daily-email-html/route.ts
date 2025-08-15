import { NextRequest, NextResponse } from 'next/server';
import { render } from '@react-email/render';
import { Collection } from 'mongodb';
import { JobPosting } from '../post-a-job/route';
import { connectToDatabase } from '@/lib/mongodb';
import JobEmailTemplate from '@/emails/daily-jobs-email';

// Type definitions
type Stack = 'frontend' | 'backend' | 'fullstack' | 'mobile' | 'dados' | 'design';
type SeniorityLevel = 'junior' | 'pleno' | 'senior';

// Add at the top
const baseUrl = process.env.NEXTAUTH_URL || "https://vaguinhas.com.br";

// Function to validate seniority level
function isValidSeniorityLevel(level: string): level is SeniorityLevel {
  return ['junior', 'pleno', 'senior'].includes(level);
}

// Function to validate stack
function isValidStack(stack: string): stack is Stack {
  return ['frontend', 'backend', 'fullstack', 'mobile', 'dados', 'design'].includes(stack);
}


// Updated function to accept filter parameters
async function getJobsFromMongo(filters?: { seniorityLevel?: string; stack?: string }) {
  const { db } = await connectToDatabase();
  const collection: Collection<JobPosting> = db.collection<JobPosting>('jobs');
  
  // Build query object based on provided filters
  const query: Partial<JobPosting> = {};
  
  if (filters?.seniorityLevel && isValidSeniorityLevel(filters.seniorityLevel)) {
    query.seniorityLevel = filters.seniorityLevel as SeniorityLevel;
  }
  
  if (filters?.stack && isValidStack(filters.stack)) {
    query.stack = filters.stack as Stack;
  }
  
  console.log('MongoDB query filters:', query);
  
  return collection.find(query).toArray();
}

// Function to process HTML content from POST request
function processPostHtmlContent(rawHtml: string): string {
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
        return `<p><a class="apply-button" href="${href}" style="background-color: #1a73e8; color: #ffffff; padding: 10px 16px; border-radius: 4px; text-decoration: none; font-weight: bold; display: inline-block; margin: 1rem 0;">Ver vaga</a></p>`;
      }
      if (companyPattern.test(text) || companyPattern.test(href)) {
        return `<a class="company-link" href="${href}" style="display: inline-block; margin: 8px 0; color: #1a73e8;">Ver empresa</a>`;
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
        .map(s => `<p class="job-description" style="color: #444444; line-height: 1.5; margin: 16px 0;">${s.trim()}</p>`)
        .join(' ');
    }
  );

  return htmlContent.trim() ? `
    <div style="color: #444444; line-height: 1.5; font-family: Arial, sans-serif; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 1px solid #eaeaea;">
      ${htmlContent}
    </div>
  ` : '';
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    let rawHtml: string;
    const url = new URL(request.url);
    const email = url.searchParams.get('email') || '';
    
    // Extract filters from query parameters
    let seniorityLevel = url.searchParams.get('seniorityLevel') || undefined;
    let stack = url.searchParams.get('stack') || undefined;
    
    const contentType = request.headers.get('content-type') || '';

    // Handle different content types for POST request body
    if (contentType.includes('application/json')) {
      const body = await request.json();
      rawHtml = body.html || '';
      
      // Extract filters from JSON body if not in query params
      if (!seniorityLevel && body.seniorityLevel) {
        seniorityLevel = body.seniorityLevel;
      }
      if (!stack && body.stack) {
        stack = body.stack;
      }
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await request.formData();
      rawHtml = formData.get('html') as string || '';
      
      // Extract filters from form data if not in query params
      if (!seniorityLevel && formData.get('seniorityLevel')) {
        seniorityLevel = formData.get('seniorityLevel') as string;
      }
      if (!stack && formData.get('stack')) {
        stack = formData.get('stack') as string;
      }
    } else if (contentType.includes('text/html') || contentType.includes('text/plain')) {
      rawHtml = await request.text();
    } else {
      return new NextResponse('Unsupported Media Type: Expected HTML, JSON, or form data', {
        status: 415,
        headers: { 
          'Content-Type': 'text/plain',
          'Accept': 'text/html, application/json, application/x-www-form-urlencoded'
        },
      });
    }

    // Build filters object
    const filters: { seniorityLevel?: string; stack?: string } = {};
    console.log('FILTERS:', seniorityLevel, stack);
    if (seniorityLevel) filters.seniorityLevel = seniorityLevel;
    if (stack) filters.stack = stack;

    // Get filtered jobs from MongoDB
    const mongoJobs = await getJobsFromMongo(Object.keys(filters).length > 0 ? filters : undefined);
    console.log('Retrieved', mongoJobs.length, 'jobs from MongoDB with filters:', filters);

    // Process additional HTML content from POST request
    const additionalContent = processPostHtmlContent(rawHtml);

    // Render the React Email template to HTML
    const emailHtml = render(JobEmailTemplate({
      email,
      jobs: mongoJobs,
      additionalContent: additionalContent || undefined,
      baseUrl
    }));

    return NextResponse.json({ 
      email, 
      html: emailHtml,
      mongoJobsCount: mongoJobs.length,
      hasPostContent: rawHtml.trim().length > 0,
      appliedFilters: filters
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