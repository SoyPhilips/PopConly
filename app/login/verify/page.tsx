"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import Logo from "@/components/Logo";
import { useFlowParams } from "@/components/SignupChrome";

export default function LoginVerifyPage() {
  const { email: queryEmail } = useFlowParams();
  const [storedEmail, setStoredEmail] = useState("");
  const [resent, setResent] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendError, setResendError] = useState("");
  const [helpOpen, setHelpOpen] = useState(false);

  useEffect(() => {
    setStoredEmail(localStorage.getItem("popconly:pending-email") ?? "");
  }, []);

  const email = queryEmail || storedEmail;

  const resend = async () => {
    if (!email || resending) return;
    setResending(true);
    setResendError("");
    try {
      const res = await signIn("nodemailer", {
        email,
        redirect: false,
        callbackUrl: `/signup/password?email=${encodeURIComponent(email)}`,
      });
      if (res?.error) {
        setResendError("No pudimos reenviar el enlace. Revisa tu conexión.");
        return;
      }
      setResent(true);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0D0D11] text-[#e4e1e7] flex flex-col">
      <header className="w-full border-b border-white/10 bg-gradient-to-b from-[#e50914]/15 to-transparent">
        <div className="max-w-[1100px] mx-auto px-4 md:px-8 py-4">
          <Link href="/" aria-label="PopConly inicio">
            <Logo size="sm" />
          </Link>
        </div>
      </header>

      <main className="flex-1 w-full max-w-[1100px] mx-auto px-4 md:px-8 py-12 flex flex-col items-center">
        <div className="w-full max-w-md">
          <h1 className="text-2xl md:text-3xl font-extrabold">
            Toca en el enlace del email
          </h1>
          <p className="text-sm text-white/70 mt-3">
            Te enviamos un enlace de registro al correo electrónico que aparece
            a continuación. Simplemente pulsa el enlace para completar el
            registro.
          </p>

          <div className="mt-5 flex items-center justify-between gap-3 rounded bg-white/10 px-4 py-3">
            <span className="text-sm truncate">{email || "tu correo"}</span>
            <Link
              href="/login"
              className="text-xs underline underline-offset-2 text-white/70 hover:text-white shrink-0"
            >
              Cambiar
            </Link>
          </div>

          <p className="text-xs text-white/60 mt-4">
            ¿No recibiste un enlace? Revisa la carpeta de correo spam o{" "}
            <button
              onClick={resend}
              disabled={resending || !email}
              className="underline underline-offset-2 hover:text-white disabled:opacity-50 cursor-pointer"
            >
              {resending ? "reenviando..." : "reenvíalo"}
            </button>
            .
          </p>
          {resendError && (
            <p className="text-xs text-[#ff6b6b] mt-2">{resendError}</p>
          )}
          {resent && (
            <p className="text-xs text-[#7ee2a8] mt-2 flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">check_circle</span>
              Enlace reenviado a {email || "tu correo"}.
            </p>
          )}

          <button
            onClick={() => setHelpOpen((v) => !v)}
            className="mt-6 text-sm text-white/80 flex items-center gap-1 hover:text-white cursor-pointer"
          >
            Obtener ayuda
            <span className="material-symbols-outlined text-base">
              {helpOpen ? "expand_less" : "expand_more"}
            </span>
          </button>
          {helpOpen && (
            <p className="text-xs text-white/50 mt-2">
              El enlace caduca en 24 horas y solo sirve una vez. Si cambiaste de
              correo, vuelve e ingrésalo de nuevo.
            </p>
          )}
        </div>
      </main>

      <footer className="w-full border-t border-white/10">
        <div className="max-w-[1100px] mx-auto px-4 md:px-8 py-8 text-xs text-white/60">
          <p className="mb-4">¿Preguntas? Llama al 01 800 519 1570 (sin cargo)</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Link href="/help" className="hover:text-white underline">Preguntas frecuentes</Link>
            <Link href="/help" className="hover:text-white underline">Centro de ayuda</Link>
            <Link href="/legal" className="hover:text-white underline">Términos de uso</Link>
            <Link href="/legal" className="hover:text-white underline">Privacidad</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
