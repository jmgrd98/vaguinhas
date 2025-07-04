import { createTransport } from 'nodemailer';
import fs from 'fs/promises';
import path from 'path';
import { randomBytes } from 'crypto';
import SupportUsEmail from '@/emails/support-us';
import { render } from '@react-email/render';
import FeedbackEmail from '@/emails/feedback';
import ProblemsEmail from '@/emails/problems';
import NewUpdateEmail from '@/emails/new-update';
import { PasswordResetEmail } from '@/emails/password-reset';
import ConfirmationEmail from '@/emails/confirmation';
// import qrCode from '@/public/qrcode-pix.png';
import FavoriteGithubEmail from '@/emails/favourite-on-github';
import AdminNotificationEmail from '@/emails/admin-notification';
import ConfirmEmailReminder from '@/emails/confirm-email-reminder';

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

});


const baseMailOptions = {
  from: `vaguinhas 🧡 <${process.env.EMAIL_FROM}>`,
  attachments: [{
      filename: 'vaguinhas.png',
      content: Buffer.from(LOGO_BASE64!.split('base64,')[1], 'base64'),
      encoding: 'base64',
      cid: 'logo@vaguinhas'
    }],
}

const baseUrl = process.env.NEXTAUTH_URL;

// async function loadTemplate(templateName: string, replacements: Record<string, string>) {
//   const templatePath = path.join(process.cwd(), 'emails', `${templateName}.tsx`);
//   let content = await fs.readFile(templatePath, 'utf-8');

//   Object.entries(replacements).forEach(([key, value]) => {
//     content = content.replace(new RegExp(`{{${key}}}`, 'g'), value);
//   });
  
//   return content;
// }


export async function sendConfirmationEmail(
  email: string,
  token: string,
  password?: string
) {
  const confirmationLink = `${baseUrl}/confirm-email?token=${token}`;
  const currentYear = new Date().getFullYear().toString();

  // Build template context
  const templateVars: Record<string, string> = {
    CONFIRMATION_LINK: confirmationLink,
    CURRENT_YEAR: currentYear,
  };

  // Only include PASSWORD if one was passed
  if (password) {
    templateVars.PASSWORD = password;
  }

  // Load the HTML from your engine (e.g. Handlebars, EJS, etc.)
  const html = await render(
    <ConfirmationEmail
      confirmationLink={confirmationLink}
      currentYear={currentYear}
      password={password}
    />
  )

  if (!LOGO_BASE64) {
    throw new Error('VAGUINHAS_LOGO is not defined');
  }

  const mailOptions = {
    ...baseMailOptions,
    to: email,
    subject: 'Confirme seu e-mail para começar a receber vaguinhas 🧡',
    html,
  };

  return transporter.sendMail(mailOptions);
}


export async function sendAdminNotification(email: string) {
  // const html = await loadTemplate('admin-notification', {
  //   USER_EMAIL: email,
  //   CURRENT_YEAR: new Date().getFullYear().toString()
  // });

  const html = await render(
    <AdminNotificationEmail 
      userEmail={email}
      currentYear={new Date().getFullYear().toString()}
      baseURL={baseUrl}
    />
  )

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

export async function sendFeedbackEmail(email: string) {
  const currentYear = new Date().getFullYear().toString();

  const html = await render(
    <FeedbackEmail 
      currentYear={currentYear}
      useCid
    />
  );
  
  const mailOptions = {
    ...baseMailOptions,
    to: email,
    subject: "Nos ajude a melhorar 🧡",
    html
  };

  return transporter.sendMail(mailOptions);
}

export async function sendSupportUsEmail(email: string) {
  const currentYear = new Date().getFullYear().toString();

  // Render the React component properly
  const html = await render(
    <SupportUsEmail 
      currentYear={currentYear}
      pixKey="vaguinhas@vaguinhas.com.br"
      useCid={true}
    />
  );

  // Read images from public directory
  const publicDir = path.join(process.cwd(), 'public');
  const [logoBuffer, qrCodeBuffer] = await Promise.all([
    fs.readFile(path.join(publicDir, 'vaguinhas-logo.png')),
    fs.readFile(path.join(publicDir, 'qrcode-pix.png'))
  ]);

  const mailOptions = {
    from: `vaguinhas 🧡 <${process.env.EMAIL_FROM}>`,
    to: email,
    subject: "Nos ajude a continuar a enviar vaguinhas 🧡",
    html,
    attachments: [
      {
        filename: 'vaguinhas-logo.png',
        content: logoBuffer,
        cid: 'logo@vaguinhas'
      },
      {
        filename: 'qrcode-pix.png',
        content: qrCodeBuffer,
        cid: 'pixqrcode@vaguinhas' // Fixed CID to match template
      }
    ]
  };

  return transporter.sendMail(mailOptions);
}

export async function sendFavouriteOnGithubEmail(email: string) {
  const html = await render(
    <FavoriteGithubEmail 
      currentYear={new Date().getFullYear().toString()}

    />
  )

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
  const html = await render(
    <ConfirmEmailReminder
      confirmationLink={confirmationLink}
      currentYear={new Date().getFullYear().toString()}
    />
  )

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

export async function sendProblemsEmail(email: string) {
  const currentYear = new Date().getFullYear().toString();

  // Renderiza o componente React para HTML
  const html = await render(
    <ProblemsEmail
      currentYear={currentYear}
      useCid={true}
    />
  );

  const mailOptions = {
    ...baseMailOptions,
    to: email,
    subject: "Estamos passando por problemas, pedimos a sua compreensão 🧡",
    html, // Usa o HTML renderizado
  };

  return transporter.sendMail(mailOptions);
}

export async function sendNewUpdateEmail(email: string) {
  const currentYear = new Date().getFullYear().toString();

  // Renderiza o componente React para HTML
  const html = await render(
    <NewUpdateEmail
      currentYear={currentYear}
      useCid={true}
    />
  );

  const mailOptions = {
    ...baseMailOptions,
    to: email,
    subject: "Agora o vaguinhas é ainda mais personalizável! 🧡",
    html, // Usa o HTML renderizado
  };

  return transporter.sendMail(mailOptions);
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const resetLink = `${baseUrl}/reset-password?token=${token}`;
  const html = await render(
    <PasswordResetEmail
      resetLink={resetLink}
    />
  )
  if (!LOGO_BASE64) {
    throw new Error("VAGUINHAS_LOGO is not defined");
  }

  const mailOptions = {
    ...baseMailOptions,
    to: email,
    subject: "Redefina sua senha 🧡",
    html,
  };

  return transporter.sendMail(mailOptions);
}