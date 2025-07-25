import { NextResponse } from "next/server";
import { sendNewUpdateEmail } from "@/lib/email";
import { getSubscribersWithoutStacks } from "@/lib/mongodb"; // Corrected import
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

/**
 * Fisher-Yates shuffle algorithm to randomize array in-place
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]; // Create a copy to avoid mutating original
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

async function throttleEmails(emails: string[], sendFn: (email: string) => Promise<unknown>, delay = 2000) {
  for (const email of emails) {
    try {
      await sendFn(email);
      await new Promise(resolve => setTimeout(resolve, delay));
    } catch (error) {
      console.error(`Failed to send to ${email}:`, error);
    }
  }
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
    const subscribers = await getSubscribersWithoutStacks();
    const emails = subscribers.map(s => s.email).filter(Boolean);
    
    if (!emails.length) {
      return NextResponse.json(
        { error: "No valid subscribers found" },
        { status: 400 }
      );
    }

    // Randomize the email list to avoid same users being affected on timeout
    const randomizedEmails = shuffleArray(emails);
    console.log(`Randomized ${randomizedEmails.length} email recipients`);

    await throttleEmails(randomizedEmails, sendNewUpdateEmail, 1500);

    return NextResponse.json(
      { 
        message: `Emails queued for ${randomizedEmails.length} recipients`,
        emailsSent: randomizedEmails.length
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Email sending failed:", error);
    return NextResponse.json(
      { error: "Email processing error" },
      { status: 500 }
    );
  }
}