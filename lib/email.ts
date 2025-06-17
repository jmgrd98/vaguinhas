import { createTransport } from 'nodemailer';
import fs from 'fs/promises';
import path from 'path';
import { randomBytes } from 'crypto';
// import qrCode from '@/public/qrcode-pix.png';

export const LOGO_BASE64 = process.env.VAGUINHAS_LOGO;

export interface Job {
  title: string;
  company: string;
  location?: string;
  url: string;
  source?: string;
  seniority?: string[];
}

const transporter = createTransport({
  // service: process.env.EMAIL_SERVICE,
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
  tls: {
    ciphers: 'SSLv3'
  }
  // tls: {
  //   minVersion: "TLSv1.2",
  //   ciphers: "HIGH:!aNULL:!eNULL:!EXPORT:!DES:!RC4:!MD5:!PSK:!SRP:!CAMELLIA",
  //   rejectUnauthorized: true,
  // },
  // connectionTimeout: 10000, // 10 seconds
  // socketTimeout: 10000, // 10 seconds
  // logger: true, // Enable logging
  // debug: true, // Enable debugging
});


const baseMailOptions = {
  from: `vaguinhas 🧡 <${process.env.EMAIL_FROM}>`,
  attachments: [{
      filename: 'vaguinhas.png',
      content: LOGO_BASE64!.split('base64,')[1],
      encoding: 'base64',
      cid: 'logo@vaguinhas'
    }],
}

const baseUrl = process.env.NEXTAUTH_URL;

async function loadTemplate(templateName: string, replacements: Record<string, string>) {
  const templatePath = path.join(process.cwd(), 'emails', `${templateName}.html`);
  let content = await fs.readFile(templatePath, 'utf-8');

  Object.entries(replacements).forEach(([key, value]) => {
    content = content.replace(new RegExp(`{{${key}}}`, 'g'), value);
  });
  
  return content;
}

export async function sendConfirmationEmail(email: string, token: string) {

  const confirmationLink = `${baseUrl}/confirm-email?token=${token}`;

  const html = await loadTemplate('confirmation', {
    CONFIRMATION_LINK: confirmationLink,
    CURRENT_YEAR: new Date().getFullYear().toString()
  });

  if (!LOGO_BASE64) {
    throw new Error('VAGUINHAS_LOGO is not defined');
  }

  const mailOptions = {
    ...baseMailOptions,
    to: email,
    subject: "Confirme seu e-mail para começar a receber vaguinhas 🧡",
    html,
  };

  return transporter.sendMail(mailOptions);
}

export async function sendAdminNotification(email: string) {
  const html = await loadTemplate('admin-notification', {
    USER_EMAIL: email,
    CURRENT_YEAR: new Date().getFullYear().toString()
  });

  const mailOptions = {
    ...baseMailOptions,
    to: "jmgrd98@gmail.com",
    subject: "Novo cadastro no vaguinhas",
    html
  };

  return transporter.sendMail(mailOptions);
}

export function generateConfirmationToken() {
  return randomBytes(32).toString('hex');
}

export async function sendSupportUsEmail(email: string) {
  const html = await loadTemplate("support-us", {
    CURRENT_YEAR: new Date().getFullYear().toString(),
  });

  if (!LOGO_BASE64) {
    throw new Error("VAGUINHAS_LOGO is not defined");
  }

  const qrCodePath = path.join(process.cwd(), 'public', 'qrcode-pix.png');
  const qrCodeBuffer = await fs.readFile(qrCodePath);
  const qrCodeBase64 = qrCodeBuffer.toString('base64');

  const mailOptions = {
    ...baseMailOptions,
    to: email,
    subject: "Nos ajude a continuar a enviar vaguinhas 🧡",
    html,
    attachments: [
      ...baseMailOptions.attachments,
      {
        filename: 'pixqrcode.png',
        content: qrCodeBase64,
        encoding: 'base64',
        cid: 'pixqrcode@vaguinhas'
      }
    ]
  };

  return transporter.sendMail(mailOptions);
}

export async function sendFavouriteOnGithubEmail(email: string) {
  const html = await loadTemplate("favourite-on-github", {
    CURRENT_YEAR: new Date().getFullYear().toString(),
  });

  if (!LOGO_BASE64) {
    throw new Error("VAGUINHAS_LOGO is not defined");
  }

  const mailOptions = {
    ...baseMailOptions,
    to: email,
    subject: "Favorite-nos no Github! 🧡",
    html,
  };

  return transporter.sendMail(mailOptions);
}

export async function sendConfirmEmailReminder(email: string, token: string) {
  const confirmationLink = `${baseUrl}/confirm-email?token=${token}`;
  const html = await loadTemplate("confirm-email-reminder", {
    CONFIRMATION_LINK: confirmationLink,
    CURRENT_YEAR: new Date().getFullYear().toString(),
  });

  if (!LOGO_BASE64) {
    throw new Error("VAGUINHAS_LOGO is not defined");
  }

  const mailOptions = {
    ...baseMailOptions,
    to: email,
    subject: "Você esqueceu de confirmar seu e-mail? 🤔",
    html,
  };

  return transporter.sendMail(mailOptions);
}