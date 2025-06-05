import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { getAllSubscribers } from "@/lib/mongodb";
import path from "path";
import fs from "fs";

export async function GET() {
  try {
    // Get all verified subscribers
    const subscribers = await getAllSubscribers();
    if (subscribers.length === 0) {
      return NextResponse.json({ message: "No subscribers found" });
    }

    // Configure Nodemailer transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    // Read logo image from public folder
    const logoPath = path.join(process.cwd(), "public", "logo.png");
    const logoData = fs.readFileSync(logoPath);

    // Prepare email template
    const currentYear = new Date().getFullYear().toString();
    const supportUsTemplate = `
    <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
        <tr>
          <td style="padding: 20px 0; text-align: center">
            <img src="cid:logo@vaguinhas" 
                 alt="vaguinhas logo"
                 style="height: auto; width: 200px;"
                 width="200"
                 height="auto">
          </td>
        </tr>
      </table>
      <h1 style="color: #ff914d; font-size: 24px; margin-top: 0">Nós precisamos do seu apoio!</h1>
      <p style="font-size: 16px; line-height: 1.5;">
        Nossa operação custa dinheiro e para continuar te mandando vaguinhas de forma gratuita, nós precisamos de fontes de renda alternativas.<br>
        Considere fazer uma doação de qualquer valor através do PIX para ajudar a nos manter online: 041.125.851-60
      </p>
      <p style="font-size: 16px; line-height: 1.5;">
        Você receberá vaguinhas de tecnologia nesse e-mail diariamente. 😊
      </p>
      <p style="font-size: 16px; line-height: 1.5;">
        Se você gostou das vaguinhas ou se possui alguma dúvida, sinta-se livre para me chamar no <a href="https://linkedin.com/in/joao-marcelo-dantas" target="_blank" style="color: #ff914d; text-decoration: none;">LinkedIn</a> para levar uma ideia!
      </p>
      <p style="font-size: 16px; line-height: 1.5;">
        Caso não tenha sido você, por favor ignore este e-mail.
      </p>
      <hr style="margin: 30px 0; border: 1px solid #e5e7eb;">
      <small style="color: #6b7280;">
        João Marcelo Dantas - ${currentYear}
      </small>
    </div>
    `;

    // Send emails in batches to avoid overwhelming the SMTP server
    const BATCH_SIZE = 20;
    for (let i = 0; i < subscribers.length; i += BATCH_SIZE) {
      const batch = subscribers.slice(i, i + BATCH_SIZE);
      
      await Promise.all(
        batch.map(async (subscriber) => {
          try {
            await transporter.sendMail({
              from: `"Vaguinhas" <${process.env.EMAIL_FROM}>`,
              to: subscriber.email,
              subject: "Nós precisamos do seu apoio!",
              html: supportUsTemplate,
              attachments: [{
                filename: "logo.png",
                content: logoData,
                cid: "logo@vaguinhas" // same cid value as in the img src
              }]
            });
          } catch (error) {
            console.error(`Failed to send to ${subscriber.email}:`, error);
          }
        })
      );
    }

    return NextResponse.json(
      { message: "Support emails sent successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Failed to send support emails:", error);
    return NextResponse.json(
      { error: "Failed to send support emails" },
      { status: 500 }
    );
  }
}