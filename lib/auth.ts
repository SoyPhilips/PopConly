import NextAuth from "next-auth";
import Nodemailer from "next-auth/providers/nodemailer";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { sendMail } from "./mail";

export const { handlers, auth, signIn, signOut } = NextAuth({
  // Sin AUTH_SECRET (aún no hay .env), usamos uno temporal solo en desarrollo
  // para que la UI no rompa. En Oracle SIEMPRE va el real (ver .env.example).
  secret:
    process.env.AUTH_SECRET ??
    (process.env.NODE_ENV === "production" ? undefined : "dev-solo-local-no-usar-en-prod"),
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  trustHost: true,
  pages: {
    signIn: "/login",
    verifyRequest: "/login/verify",
    newUser: "/signup/password",
    error: "/login/error",
  },
  providers: [
    Nodemailer({
      // Validación de Auth.js exige `server`; el envío real usa `transport` de abajo.
      server: {
        host: process.env.SMTP_HOST || "localhost",
        port: Number(process.env.SMTP_PORT ?? 1025),
        auth: {
          user: process.env.SMTP_USER || "popconly",
          pass: process.env.SMTP_PASS || "popconly",
        },
      },
      from: process.env.SMTP_FROM ?? "PopConly <cuentas@popconly.com>",
      sendVerificationRequest: async ({ identifier, url }) => {
        // Borrón y cuenta nueva: si hay un intento INCOMPLETO (clic mágico
        // viejo sin contraseña), se olvida por completo (usuario + tokens
        // viejos) para empezar limpio. Las cuentas CON contraseña jamás se tocan.
        try {
          const email = identifier.toLowerCase().trim();
          const stale = await prisma.user.findUnique({
            where: { email },
            select: { id: true, passwordHash: true },
          });
          if (stale && !stale.passwordHash) {
            await prisma.user.delete({ where: { id: stale.id } });
            await prisma.verificationToken.deleteMany({
              where: {
                OR: [
                  { identifier: `otp:${email}` },
                  {
                    identifier: email,
                    expires: { lt: new Date(Date.now() + 23 * 3600 * 1000) },
                  },
                ],
              },
            });
          }
        } catch {
          /* sigue el flujo normal */
        }
        await sendMail(
          identifier,
          "Completa tu registro en PopConly",
          `Pulsa este enlace para completar tu registro:\n\n${url}\n\nSi no fuiste tú, ignora este correo.`,
          `<p>Pulsa este enlace para completar tu registro en <strong>PopConly</strong>:</p><p><a href="${url}">Completar suscripción</a></p><p>Si no fuiste tú, ignora este correo.</p>`
        );
      },
    }),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contraseña", type: "password" },
        code: { label: "Código", type: "text" },
      },
      authorize: async (credentials) => {
        const email = String(credentials?.email ?? "").toLowerCase().trim();
        const password = String(credentials?.password ?? "");
        const code = String(credentials?.code ?? "").trim();
        if (!email) return null;
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return null;
        // Sin contraseña no hay entrada: la cuenta nace al ponerla en
        // /signup/password (el clic mágico solo verifica el correo).
        if (!user.passwordHash) return null;
        // Código de verificación de un solo uso (login con cuenta existente).
        if (code) {
          const candidates = await prisma.verificationToken.findMany({
            where: { identifier: `otp:${email}` },
          });
          for (const c of candidates) {
            if (c.expires < new Date()) continue;
            if (await bcrypt.compare(code, c.token)) {
              await prisma.verificationToken.deleteMany({ where: { identifier: `otp:${email}` } });
              return { id: user.id, email: user.email, name: user.name, image: user.image };
            }
          }
          return null;
        }
        // Contraseña (registro y entrada automática).
        if (!password || !user.passwordHash) return null;
        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;
        return { id: user.id, email: user.email, name: user.name, image: user.image };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) token.sub = user.id;
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        (session.user as { id?: string }).id = token.sub;
      }
      return session;
    },
  },
});
