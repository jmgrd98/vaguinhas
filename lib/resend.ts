import { Resend, Attachment } from 'resend';
import { randomBytes } from 'crypto';
// import path from 'path';
import { readFile } from 'fs/promises';

// Import React Email components
import ConfirmationEmail from '@/emails/confirmation';
import AdminNotificationEmail from '@/emails/admin-notification';
import SupportUsEmail from '@/emails/support-us';
import FavouriteGithubEmail from '@/emails/favourite-on-github';
import ConfirmEmailReminderEmail from '@/emails/confirm-email-reminder';

import path from 'path';

// Initialize Resend
if (!process.env.RESEND_API_KEY) {
  throw new Error('RESEND_API_KEY não definida');
}
const resend = new Resend(process.env.RESEND_API_KEY);

// Base URL for images
const baseURL = process.env.NODE_ENV === 'production'
  ? 'https://www.vaguinhas.com.br'
  : '';

// Base "from" configuration
const DEFAULT_FROM = `vaguinhas 🧡 <${process.env.EMAIL_FROM}>`;
if (!process.env.EMAIL_FROM) {
  console.warn('⚠️ EMAIL_FROM não definido. Ajuste sua env var.');
}

// Generate confirmation token
export function generateConfirmationToken() {
  return randomBytes(32).toString('hex');
}

// 1. Send confirmation email
export async function sendConfirmationEmail(email: string, token: string) {
  const confirmationLink = `${process.env.NEXTAUTH_URL}/confirm-email?token=${token}`;
  const currentYear = new Date().getFullYear().toString();
  
  return await resend.emails.send({
    from: DEFAULT_FROM,
    to: [email],
    subject: 'Confirme seu e-mail para começar a receber vaguinhas 🧡',
    react: await ConfirmationEmail({ 
      confirmationLink, 
      currentYear,
      baseURL
    }),
  });
}

// 2. Send admin notification
export async function sendAdminNotification(userEmail: string) {
  const currentYear = new Date().getFullYear().toString();
  
  return await resend.emails.send({
    from: DEFAULT_FROM,
    to: ['jmgrd98@gmail.com'],
    subject: 'Novo cadastro no vaguinhas',
    react: await AdminNotificationEmail({ 
      userEmail, 
      currentYear,
      baseURL
    }),
  });
}

// 3. Send support request email
// resend.ts

export async function sendSupportUsEmail(email: string) {
  const currentYear = new Date().getFullYear().toString();
  
  // Use base64 locally, URLs in production
  const attachments: Attachment[] = [];
//   const baseURL = process.env.NODE_ENV === 'production'
//     ? process.env.NEXTAUTH_URL || 'https://www.vaguinhas.com.br'
//     : 'http://localhost:3000';

  if (process.env.NODE_ENV === 'production') {
    // Production: Use remote URLs
    attachments.push(
      {
        filename: 'vaguinhas-logo.png',
        // url: `${baseURL}/vaguinhas-logo.png`,
        // content_id: 'logo',
        // disposition: 'inline',
      },
      {
        filename: 'qrcode-pix.png',
        // url: `${baseURL}/qrcode-pix.png`,
        // content_id: 'pixqrcode',
        // disposition: 'inline',
      }
    );
  } else {
    // Development: Use base64
    try {
      const publicDir = path.join(process.cwd(), 'public');
      const [logoBuffer, qrBuffer] = await Promise.all([
        readFile(path.join(publicDir, 'vaguinhas-logo.png')),
        readFile(path.join(publicDir, 'qrcode-pix.png'))
      ]);

      attachments.push(
        {
          filename: 'vaguinhas-logo.png',
          content: logoBuffer.toString('base64'),
        //   content_id: 'logo',
        //   encoding: 'base64',
        //   disposition: 'inline',
        },
        {
          filename: 'qrcode-pix.png',
          content: qrBuffer.toString('base64'),
        //   content_id: 'pixqrcode',
        //   encoding: 'base64',
        //   disposition: 'inline',
        }
      );
    } catch (error) {
      console.error('Failed to read local images:', error);
      throw error;
    }
  }

  return await resend.emails.send({
    from: DEFAULT_FROM,
    to: [email],
    subject: 'Nos ajude a continuar a enviar vaguinhas 🧡',
    react: await SupportUsEmail({ 
      currentYear,
      pixKey: 'vaguinhas@vaguinhas.com.br',
      useCid: true
    }),
    attachments,
  });
}

// 4. Send GitHub favorite request
export async function sendFavouriteOnGithubEmail(email: string) {
  const currentYear = new Date().getFullYear().toString();
  
  return await resend.emails.send({
    from: DEFAULT_FROM,
    to: [email],
    subject: 'Favorite-nos no Github! 🧡',
    react: await FavouriteGithubEmail({ 
      currentYear,
    }),
  });
}

// 5. Send email confirmation reminder
export async function sendConfirmEmailReminder(email: string, token: string) {
  const confirmationLink = `${process.env.NEXTAUTH_URL}/confirm-email?token=${token}`;
  const currentYear = new Date().getFullYear().toString();
  
  return await resend.emails.send({
    from: DEFAULT_FROM,
    to: [email],
    subject: 'Você esqueceu de confirmar seu e-mail? 🤔',
    react: await ConfirmEmailReminderEmail({ 
      confirmationLink, 
      currentYear,
      baseURL
    }),
  });
}