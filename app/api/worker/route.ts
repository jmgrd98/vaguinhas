import { emailQueue } from '@/lib/queue';
import { sendSupportUsEmail } from '@/lib/email';
import { NextResponse } from 'next/server';

// Required for Vercel cron jobs
export const dynamic = 'force-dynamic';
export const maxDuration = 10; // 10 seconds timeout (Hobby plan)

export async function GET() {
  try {
    const counts = await emailQueue.getJobCounts();
    const pendingJobs = counts.waiting + counts.delayed;
    
    if (pendingJobs === 0) {
      return NextResponse.json({
        processed: 0,
        status: 'no_jobs'
      });
    }

    console.log(`Processing ${pendingJobs} pending jobs`);
    
    const jobs = await emailQueue.getJobs(['waiting', 'delayed'], 0, 5); // Process max 5 jobs
    let processedCount = 0;
    
    for (const job of jobs) {
      try {
        const { to } = job.data;
        console.log(`Processing job ${job.id} for ${to}`);
        
        // Check if job is ready (delay has passed)
        if (job.opts.delay && job.opts.delay > 0) {
          const runTime = job.timestamp + job.opts.delay;
          if (Date.now() < runTime) {
            console.log(`Skipping job ${job.id} (scheduled for later)`);
            continue;
          }
        }
        
        await sendSupportUsEmail(to);
        await job.moveToCompleted('Processed', true);
        processedCount++;
        console.log(`✅ Processed job ${job.id} for ${to}`);
      } catch (error: unknown) {
        console.error('Worker error:', error);
        return NextResponse.json(
            { error: (error as Error).message || 'Unknown error' },
            { status: 500 }
        );
        }
    }
    
    return NextResponse.json({
      processed: processedCount,
      status: 'success'
    });
  } catch (error: unknown) {
        if (error instanceof Error) {
            console.error('Worker error:', error);
            return NextResponse.json(
            { error: error.message },
            { status: 500 }
            );
        } else {
            console.error('Worker error:', error);
            return NextResponse.json(
            { error: 'Unknown error' },
            { status: 500 }
            );
        }
    }
}