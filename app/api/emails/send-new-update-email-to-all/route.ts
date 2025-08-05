import { NextResponse } from "next/server";
import { getSubscribersWithoutStacks } from "@/lib/mongodb";
import { getEmailQueue } from "@/lib/emailQueue";
import isRateLimited from "@/utils/isRateLimited";
import shuffleArray from "@/utils/shuffleArray";


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

     let queue;
       try {
         queue = getEmailQueue();
       } catch (error) {
         console.error("Queue initialization failed:", error);
         return NextResponse.json(
           { error: "Email queue initialization error" },
           { status: 500 }
         );
       }
       
       const jobs = randomizedEmails.map(email => ({
         name: `new-update-email-${email}`,
         data: { 
           email,
           jobType: 'new-update'  // Add this
         },
       }));
       await queue.addBulk(jobs);
   
       return NextResponse.json({
         message: `${jobs.length} emails queued for delivery`,
         recipients: randomizedEmails.length,
         // jobType: 'feedback-email',
       });
  } catch (error) {
    console.error("Email sending failed:", error);
    return NextResponse.json(
      { error: "Email processing error" },
      { status: 500 }
    );
  }
}