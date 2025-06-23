import { Resend } from 'resend';
import { randomBytes } from 'crypto';

import ConfirmationEmail from '@/emails/confirmation';
import AdminNotificationEmail from '@/emails/admin-notification';
import SupportUsEmail from '@/emails/support-us';
import FavouriteGithubEmail from '@/emails/favourite-on-github';
import ConfirmEmailReminderEmail from '@/emails/confirm-email-reminder';

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
export async function sendConfirmationEmail(email: string, token: string, password?: string) {
  const confirmationLink = `${process.env.NEXTAUTH_URL}/confirm-email?token=${token}`;
  const currentYear = new Date().getFullYear().toString();
  
  return await resend.emails.send({
    from: DEFAULT_FROM,
    to: [email],
    subject: 'Confirme seu e-mail para começar a receber vaguinhas 🧡',
    react: await ConfirmationEmail({ 
      confirmationLink, 
      currentYear,
      baseURL,
      password
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
  
//   const baseURL = process.env.NODE_ENV === 'production'
//     ? process.env.NEXTAUTH_URL || 'https://www.vaguinhas.com.br'
//     : 'http://localhost:3000';



  return await resend.emails.send({
    from: DEFAULT_FROM,
    to: [email],
    subject: 'Nos ajude a continuar a enviar vaguinhas 🧡',
    react: await SupportUsEmail({ 
      currentYear,
      pixKey: 'vaguinhas@vaguinhas.com.br',
      useCid: true
    }),
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