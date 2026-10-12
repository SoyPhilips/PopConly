import nodemailer from "nodemailer";

export const smtpConfigured = Boolean(
  process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS
);

type TransportConfig = Parameters<typeof nodemailer.createTransport>[0];

const transportConfig = (
  smtpConfigured
    ? {
        host: process.env.SMTP_HOST as string,
        port: Number(process.env.SMTP_PORT ?? 587),
        secure: process.env.SMTP_SECURE === "true",
        auth: {
          user: process.env.SMTP_USER as string,
          pass: process.env.SMTP_PASS as string,
        },
      }
    : { streamTransport: true, newline: "unix" }
) as unknown as TransportConfig;

const transport = nodemailer.createTransport(transportConfig);

const FROM = process.env.SMTP_FROM ?? "PopConly <cuentas@popconly.tv>";

export async function sendMail(to: string, subject: string, text: string, html: string) {
  if (process.env.NODE_ENV !== "production" || !smtpConfigured) {
    console.log(`\n[PopConly] Correo para ${to} — ${subject}\n${text}\n`);
  }
  await transport.sendMail({ from: FROM, to, subject, text, html });
}
