export default async function sendBatchEmails(
  emails: string[],
  sendFn: (email: string) => Promise<unknown>,
  batchSize = 10,
  delayBetweenBatches = 1000
) {
  const batches = [];
  
  // Create batches
  for (let i = 0; i < emails.length; i += batchSize) {
    batches.push(emails.slice(i, i + batchSize));
  }

  // Process batches with rate limiting
  for (const batch of batches) {
    try {
      // Send all emails in current batch concurrently
      await Promise.allSettled(
        batch.map(email => 
          sendFn(email).catch(e => 
            console.error(`Failed to send to ${email}:`, e)
        )
      ));
      
      // Add delay between batches (except last batch)
      if (batch !== batches[batches.length - 1]) {
        await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
      }
    } catch (batchError) {
      console.error("Batch failed:", batchError);
    }
  }
}