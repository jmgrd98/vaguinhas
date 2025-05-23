import { createTransport } from 'nodemailer';
import fs from 'fs/promises';
import path from 'path';

export const LOGO_BASE64 = process.env.VAGUINHAS_LOGO

const transporter = createTransport({
  service: process.env.EMAIL_SERVICE,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

async function loadTemplate(templateName: string, replacements: Record<string, string>) {
  const templatePath = path.join(process.cwd(), 'emails', `${templateName}.html`);
  let content = await fs.readFile(templatePath, 'utf-8');
  
  // Replace placeholders
  Object.entries(replacements).forEach(([key, value]) => {
    content = content.replace(new RegExp(`{{${key}}}`, 'g'), value);
  });
  
  return content;
}

export async function sendConfirmationEmail(email: string, token: string) {
  const baseUrl = process.env.NEXTAUTH_URL;
  const confirmationLink = `${baseUrl}/confirm-email?token=${token}`;

  const html = await loadTemplate('confirmation', {
    CONFIRMATION_LINK: confirmationLink,
    CURRENT_YEAR: new Date().getFullYear().toString()
  });

  if (!LOGO_BASE64) {
    throw new Error('VAGUINHAS_LOGO is not defined');
  }

  const mailOptions = {
    from: `vaguinhas <${process.env.EMAIL_FROM}>`,
    to: email,
    subject: "Confirme seu e-mail - vaguinhas",
    html,
    attachments: [{
      filename: 'vaguinhas.png',
      content: LOGO_BASE64.split('base64,')[1],
      encoding: 'base64',
      cid: 'logo@vaguinhas'
    }]
  };

  return transporter.sendMail(mailOptions);
}

export async function sendAdminNotification(email: string) {
  const html = await loadTemplate('admin-notification', {
    USER_EMAIL: email,
    CURRENT_YEAR: new Date().getFullYear().toString()
  });

  const mailOptions = {
    from: `Vaguinhas <${process.env.EMAIL_FROM}>`,
    to: "jmgrd98@gmail.com",
    subject: "Novo cadastro no vaguinhas",
    html
  };

  return transporter.sendMail(mailOptions);
}

export function generateConfirmationToken() {
  return require('crypto').randomBytes(32).toString('hex');
}