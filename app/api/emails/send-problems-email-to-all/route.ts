import { NextResponse } from "next/server";
import sendBatchEmails from "@/lib/sendBatchEmails";
import { sendProblemsEmail } from "@/lib/email";
import { getAllSubscribers } from "@/lib/mongodb";
import { LRUCache } from "lru-cache";


// Initialize rate limiter only in production
const rateLimitCache = process.env.NODE_ENV === "production" 
  ? new LRUCache<string, number[]>({
      max: 100,
      ttl: 30 * 60 * 1000, // 30 minutes
    })
  : null;

function isRateLimited(token: string, limit = 5) {
  // Bypass rate limiting in non-production environments
  if (!rateLimitCache || process.env.NODE_ENV !== "production") return false;
  
  const tokenCount = rateLimitCache.get(token) || [0];
  if (tokenCount[0] >= limit) return true;
  
  rateLimitCache.set(token, [tokenCount[0] + 1]);
  return false;
}

export async function GET(req: Request) {
  // Authentication
  const token = req.headers.get('authorization')?.split(' ')[1];
  if (!token || token !== process.env.JWT_SECRET) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  // Rate limiting (production only)
  if (isRateLimited(token)) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Try again in 30 minutes." },
      { status: 429 }
    );
  }

 try {
     // Get all subscribers with pagination support
     let allSubscribers: { email: string }[] = [];
     let page = 1;
     const pageSize = 500;
     let hasMore = true;
 
     while (hasMore) {
       console.log("Fetching subscribers page:", page);
       const { subscribers, total } = await getAllSubscribers(page, pageSize);
       allSubscribers = [...allSubscribers, ...subscribers.map(s => ({ email: s.email }))];
       
       // Check if we've fetched all records
       hasMore = page * pageSize < total;
       page++;
     }
 
     const emails = allSubscribers.map(s => s.email).filter(Boolean);
     
     if (!emails.length) {
       return NextResponse.json(
         { error: "No valid subscribers found" },
         { status: 400 }
       );
     }
 
     // Process emails in background
     console.log(`Starting email sending to ${emails.length} recipients`);
     await sendBatchEmails(emails, sendProblemsEmail, 10);
 
     return NextResponse.json(
       { 
         message: `Emails sent to ${emails.length} recipients`,
         recipients: emails.length
       },
       { status: 200 }
     );
   } catch (error) {
     console.error("Background email processing failed:", error);
     return NextResponse.json(
       { error: "Background email processing error" },
       { status: 500 }
     );
   }
}