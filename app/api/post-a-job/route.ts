// app/api/post-a-job/route.ts
import { connectToDatabase } from '@/lib/mongodb';
import { NextRequest, NextResponse } from 'next/server';
import { Collection, InsertOneResult, WithId, Document } from 'mongodb';

// Type definitions
type Stack = 'frontend' | 'backend' | 'fullstack' | 'mobile' | 'dados' | 'design';
type SeniorityLevel = 'junior' | 'pleno' | 'senior';
type JobStatus = 'pending' | 'approved' | 'rejected';
type Currency = 'BRL' | 'USD' | 'EUR';
type JobType = 'nacional' | 'internacional';

export interface JobPosting {
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

interface JobPostingRequest {
  linkVaga: string;
  nomeEmpresa: string;
  cambio?: Currency;
  tipoVaga?: JobType;
  stack: Stack;
  seniorityLevel: SeniorityLevel;
  cargo: string;
  descricao: string;
  createdAt?: string;
  status?: JobStatus;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

interface JobQuery {
  status?: JobStatus;
  stack?: Stack;
  seniorityLevel?: SeniorityLevel;
  nomeEmpresa?: string;
  cargo?: string;
  createdAt?: { $gte: string };
}

interface PaginationParams {
  limit: number;
  skip: number;
}

interface PaginationResponse {
  total: number;
  limit: number;
  skip: number;
  hasMore: boolean;
}

interface SuccessResponse<T = unknown> {
  success: true;
  message?: string;
  data?: T;
  pagination?: PaginationResponse;
}

interface ErrorResponse {
  success: false;
  message: string;
  errors?: string[];
}

type ApiResponse<T = unknown> = SuccessResponse<T> | ErrorResponse;

// Type guards
function isValidStack(stack: string): stack is Stack {
  return ['frontend', 'backend', 'fullstack', 'mobile', 'dados', 'design'].includes(stack);
}

function isValidSeniorityLevel(level: string): level is SeniorityLevel {
  return ['junior', 'pleno', 'senior'].includes(level);
}

function isValidCurrency(currency: string): currency is Currency {
  return ['BRL', 'USD', 'EUR'].includes(currency);
}

function isValidJobType(type: string): type is JobType {
  return ['nacional', 'internacional'].includes(type);
}

function isValidJobStatus(status: string): status is JobStatus {
  return ['pending', 'approved', 'rejected'].includes(status);
}

// Validation function
function validateJobData(data: Partial<JobPostingRequest>): ValidationResult {
  const errors: string[] = [];
  
  // Required fields validation
  const requiredFields: (keyof JobPostingRequest)[] = [
    'linkVaga',
    'nomeEmpresa',
    'cargo',
    'stack',
    'seniorityLevel',
    'descricao'
  ];

  for (const field of requiredFields) {
    if (!data[field] || (typeof data[field] === 'string' && data[field].trim() === '')) {
      errors.push(`${field} é obrigatório`);
    }
  }

  // URL validation
  if (data.linkVaga) {
    try {
      new URL(data.linkVaga);
    } catch {
      errors.push('Link da vaga deve ser uma URL válida');
    }
  }

  // Stack validation
  if (data.stack && !isValidStack(data.stack)) {
    errors.push('Área inválida');
  }

  // Seniority level validation
  if (data.seniorityLevel && !isValidSeniorityLevel(data.seniorityLevel)) {
    errors.push('Nível profissional inválido');
  }

  // Currency validation (optional field)
  if (data.cambio && !isValidCurrency(data.cambio)) {
    errors.push('Moeda inválida');
  }

  // Job type validation (optional field)
  if (data.tipoVaga && !isValidJobType(data.tipoVaga)) {
    errors.push('Tipo de vaga inválido');
  }

  // Status validation (optional field)
  if (data.status && !isValidJobStatus(data.status)) {
    errors.push('Status inválido');
  }

  // Description length validation
  if (data.descricao) {
    const descLength = data.descricao.length;
    if (descLength < 50) {
      errors.push('Descrição deve ter pelo menos 50 caracteres');
    }
    if (descLength > 5000) {
      errors.push('Descrição não pode exceder 5000 caracteres');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// POST handler
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<WithId<JobPosting>>>> {
  try {
    // Parse request body
    const body: unknown = await request.json();
    
    // Type check the body
    if (!body || typeof body !== 'object') {
      return NextResponse.json<ErrorResponse>(
        { 
          success: false, 
          message: 'Dados inválidos'
        },
        { status: 400 }
      );
    }

    const jobData = body as Partial<JobPostingRequest>;
    
    // Validate the data
    const validation = validateJobData(jobData);
    if (!validation.isValid) {
      return NextResponse.json<ErrorResponse>(
        { 
          success: false, 
          message: 'Dados inválidos', 
          errors: validation.errors 
        },
        { status: 400 }
      );
    }

    // Type assertion after validation
    const validatedData = jobData as JobPostingRequest;

    // Connect to MongoDB
    const { db } = await connectToDatabase();
    const collection: Collection<JobPosting> = db.collection<JobPosting>('jobs');

    // Check for duplicate job posting (same company, same position, within last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    // const duplicateQuery: JobQuery = {
    //   nomeEmpresa: validatedData.nomeEmpresa,
    //   cargo: validatedData.cargo,
    //   createdAt: { $gte: sevenDaysAgo.toISOString() }
    // };

    // const duplicate = await collection.findOne(duplicateQuery as Document);

    // if (duplicate) {
    //   return NextResponse.json<ErrorResponse>(
    //     { 
    //       success: false, 
    //       message: 'Uma vaga similar já foi publicada recentemente por esta empresa' 
    //     },
    //     { status: 409 }
    //   );
    // }

    // Prepare job document
    const jobDocument: JobPosting = {
      linkVaga: validatedData.linkVaga.trim(),
      nomeEmpresa: validatedData.nomeEmpresa.trim(),
      cambio: validatedData.cambio || 'BRL',
      tipoVaga: validatedData.tipoVaga || 'nacional',
      stack: validatedData.stack,
      seniorityLevel: validatedData.seniorityLevel,
      cargo: validatedData.cargo.trim(),
      descricao: validatedData.descricao.trim(),
      createdAt: validatedData.createdAt || new Date().toISOString(),
      status: validatedData.status || 'pending',
      updatedAt: new Date().toISOString()
    };

    // Insert into MongoDB
    const result: InsertOneResult<JobPosting> = await collection.insertOne(jobDocument);

    // Create response with inserted document
    const insertedDocument: WithId<JobPosting> = {
      _id: result.insertedId,
      ...jobDocument
    };

    // Return success response
    return NextResponse.json<SuccessResponse<WithId<JobPosting>>>(
      {
        success: true,
        message: 'Vaga publicada com sucesso',
        data: insertedDocument
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error creating job posting:', error);
    
    // Check for specific MongoDB errors
    if (error instanceof Error) {
      if (error.message.includes('MONGODB_URI')) {
        return NextResponse.json<ErrorResponse>(
          { 
            success: false, 
            message: 'Erro de configuração do servidor' 
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json<ErrorResponse>(
      { 
        success: false, 
        message: 'Erro ao publicar vaga. Por favor, tente novamente.' 
      },
      { status: 500 }
    );
  }
}

// GET handler (optional - to retrieve jobs)
export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<WithId<JobPosting>[]>>> {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters with type safety
    const stackParam = searchParams.get('stack');
    const seniorityParam = searchParams.get('seniorityLevel');
    const statusParam = searchParams.get('status') || 'approved';
    const limitParam = searchParams.get('limit') || '20';
    const skipParam = searchParams.get('skip') || '0';

    // Validate and parse parameters
    const stack: Stack | undefined = stackParam && isValidStack(stackParam) ? stackParam : undefined;
    const seniorityLevel: SeniorityLevel | undefined = seniorityParam && isValidSeniorityLevel(seniorityParam) ? seniorityParam : undefined;
    const status: JobStatus = isValidJobStatus(statusParam) ? statusParam : 'approved';
    
    const pagination: PaginationParams = {
      limit: Math.min(Math.max(1, parseInt(limitParam, 10)), 100), // Limit between 1-100
      skip: Math.max(0, parseInt(skipParam, 10))
    };

    // Connect to MongoDB
    const { db } = await connectToDatabase();
    const collection: Collection<JobPosting> = db.collection<JobPosting>('jobs');

    // Build query with proper typing
    const query: JobQuery = { status };
    if (stack) query.stack = stack;
    if (seniorityLevel) query.seniorityLevel = seniorityLevel;

    // Fetch jobs
    const jobs = await collection
      .find(query as Document)
      .sort({ createdAt: -1 })
      .skip(pagination.skip)
      .limit(pagination.limit)
      .toArray();

    // Get total count for pagination
    const total = await collection.countDocuments(query as Document);

    const paginationResponse: PaginationResponse = {
      total,
      limit: pagination.limit,
      skip: pagination.skip,
      hasMore: pagination.skip + pagination.limit < total
    };

    return NextResponse.json<SuccessResponse<WithId<JobPosting>[]>>({
      success: true,
      data: jobs as WithId<JobPosting>[],
      pagination: paginationResponse
    });

  } catch (error) {
    console.error('Error fetching jobs:', error);
    
    return NextResponse.json<ErrorResponse>(
      { 
        success: false, 
        message: 'Erro ao buscar vagas' 
      },
      { status: 500 }
    );
  }
}

// OPTIONS handler for CORS (if needed)
export async function OPTIONS(): Promise<NextResponse> {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}