"use server";

import bcrypt from "bcryptjs";
import { randomInt } from "crypto";
import { prisma } from "./prisma";
import { sendMail } from "./mail";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export async function checkUser(email: string) {
  const clean = email.toLowerCase().trim();
  if (!EMAIL_RE.test(clean)) return { ok: false as const, error: "Email inválido." };
  const user = await prisma.user.findUnique({ where: { email: clean } });
  return { ok: true as const, exists: Boolean(user), hasPassword: Boolean(user?.passwordHash) };
}

export async function registerUser(email: string, password: string) {
  const clean = email.toLowerCase().trim();
  if (!EMAIL_RE.test(clean)) return { ok: false as const, error: "Ingresa un email válido." };
  if (password.length < 6)
    return { ok: false as const, error: "La contraseña debe tener al menos 6 caracteres." };
  const passwordHash = await bcrypt.hash(password, 12);
  const existing = await prisma.user.findUnique({ where: { email: clean } });
  if (existing) {
    await prisma.user.update({ where: { email: clean }, data: { passwordHash } });
  } else {
    await prisma.user.create({
      data: {
        email: clean,
        passwordHash,
        profiles: { create: [{ name: "Principal", kind: "adult" }] },
      },
    });
  }
  return { ok: true as const };
}

/** Envía un código de 6 dígitos al correo (solo cuentas existentes). */
export async function requestLoginCode(email: string) {
  const clean = email.toLowerCase().trim();
  if (!EMAIL_RE.test(clean)) return { ok: false as const, error: "Ingresa un email válido." };
  const user = await prisma.user.findUnique({ where: { email: clean } });
  if (!user) return { ok: false as const, error: "Esta cuenta no existe. Regístrate primero." };
  const code = String(randomInt(100000, 1000000));
  const token = await bcrypt.hash(code, 10);
  await prisma.verificationToken.deleteMany({ where: { identifier: `otp:${clean}` } });
  await prisma.verificationToken.create({
    data: {
      identifier: `otp:${clean}`,
      token,
      expires: new Date(Date.now() + 10 * 60 * 1000),
    },
  });
  try {
    await sendMail(
      clean,
      "Tu código de acceso a PopConly",
      `Tu código de verificación es: ${code}\nVence en 10 minutos. Si no fuiste tú, ignora este correo.`,
      `<p>Tu código de verificación de <strong>PopConly</strong> es:</p><p style="font-size:28px;font-weight:bold;letter-spacing:6px">${code}</p><p>Vence en 10 minutos. Si no fuiste tú, ignora este correo.</p>`
    );
  } catch {
    return { ok: false as const, error: "No pudimos enviar el código. Inténtalo de nuevo." };
  }
  return { ok: true as const };
}
