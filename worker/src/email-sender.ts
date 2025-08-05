import nodemailer from 'nodemailer';

// Create a type alias for clarity
type MailTransporter = typeof nodemailer.Transporter;

let transporter: MailTransporter | null = null;

export function getTransporter(): MailTransporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'SendGrid',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }
  return transporter;
}

export async function sendEmail(to: string, html: string, subject = 'Notification from our service') {
  const mailer = getTransporter();
  
  await mailer.sendMail({
    from: process.env.EMAIL_FROM || '"Your Service" <noreply@yourservice.com>',
    to,
    subject,
    html,
  });
}