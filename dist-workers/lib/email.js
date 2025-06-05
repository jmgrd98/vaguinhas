import { createTransport } from 'nodemailer';
import fs from 'fs/promises';
import path from 'path';
import { randomBytes } from 'crypto';
export const LOGO_BASE64 = process.env.VAGUINHAS_LOGO;
const transporter = createTransport({
    service: process.env.EMAIL_SERVICE,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
    },
});
async function loadTemplate(templateName, replacements) {
    const templatePath = path.join(process.cwd(), 'emails', `${templateName}.html`);
    let content = await fs.readFile(templatePath, 'utf-8');
    Object.entries(replacements).forEach(([key, value]) => {
        content = content.replace(new RegExp(`{{${key}}}`, 'g'), value);
    });
    return content;
}
// NEW: Format job listings into HTML
function formatJobs(jobs) {
    if (jobs.length === 0) {
        return `
      <div style="margin: 20px 0; padding: 15px; background: #f8f9fa; border-radius: 8px;">
        <p style="margin: 0;">Não encontramos vagas novas hoje. Verificaremos novamente amanhã!</p>
      </div>
    `;
    }
    return jobs.map(job => `
    <div style="margin: 20px 0; padding: 15px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid #ff914d;">
      <h3 style="margin: 0 0 10px 0;">
        <a href="${job.url}" style="color: #ff914d; text-decoration: none;">${job.title}</a>
      </h3>
      <div style="display: flex; flex-wrap: wrap; gap: 15px; margin-bottom: 10px;">
        <div>
          <strong>Empresa:</strong> ${job.company}
        </div>
        <div>
          <strong>Local:</strong> ${job.location}
        </div>
        <div>
          <strong>Nível:</strong> ${job.seniority.join(', ')}
        </div>
      </div>
      <div>
        <strong>Fonte:</strong> ${job.source}
      </div>
    </div>
  `).join('');
}
// NEW: Send daily digest email
export async function sendDailyEmail(email, jobs, unsubscribeToken) {
    const baseUrl = process.env.NEXTAUTH_URL;
    const unsubscribeLink = `${baseUrl}/unsubscribe?token=${unsubscribeToken}`;
    const html = await loadTemplate('daily-jobs', {
        JOBS_LIST: formatJobs(jobs),
        UNSUBSCRIBE_LINK: unsubscribeLink,
        CURRENT_YEAR: new Date().getFullYear().toString()
    });
    if (!LOGO_BASE64) {
        throw new Error('VAGUINHAS_LOGO is not defined');
    }
    const mailOptions = {
        from: `vaguinhas <${process.env.EMAIL_FROM}>`,
        to: email,
        subject: "Vaguinhas do dia!",
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
export async function sendConfirmationEmail(email, token) {
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
        from: `vaguinhas 🧡 <${process.env.EMAIL_FROM}>`,
        to: email,
        subject: "Confirme seu e-mail para começar a receber vaguinhas 🧡",
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
export async function sendAdminNotification(email) {
    const html = await loadTemplate('admin-notification', {
        USER_EMAIL: email,
        CURRENT_YEAR: new Date().getFullYear().toString()
    });
    const mailOptions = {
        from: `vaguinhas 🧡 <${process.env.EMAIL_FROM}>`,
        to: "jmgrd98@gmail.com",
        subject: "Novo cadastro no vaguinhas",
        html
    };
    return transporter.sendMail(mailOptions);
}
export function generateConfirmationToken() {
    return randomBytes(32).toString('hex');
}
export async function sendSupportUsEmail(email) {
    const html = await loadTemplate("support-us", {
        CURRENT_YEAR: new Date().getFullYear().toString(),
    });
    if (!LOGO_BASE64) {
        throw new Error("VAGUINHAS_LOGO is not defined");
    }
    const mailOptions = {
        from: `vaguinhas <${process.env.EMAIL_FROM}>`,
        to: email,
        subject: "Nos ajude a continuar – apoie a Vaguinhas",
        html,
        attachments: [
            {
                filename: "vaguinhas.png",
                content: LOGO_BASE64.split("base64,")[1],
                encoding: "base64",
                cid: "logo@vaguinhas",
            },
        ],
    };
    return transporter.sendMail(mailOptions);
}
