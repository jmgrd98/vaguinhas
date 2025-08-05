export default async function throttleEmails(emails: string[], sendFn: (email: string) => Promise<unknown>, delay = 2000) {
  for (const email of emails) {
    try {
      await sendFn(email);
      await new Promise(resolve => setTimeout(resolve, delay));
    } catch (error) {
      console.error(`Failed to send to ${email}:`, error);
    }
  }
}