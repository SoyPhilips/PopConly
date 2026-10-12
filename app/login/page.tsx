"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Logo from "@/components/Logo";
import { checkUser, requestLoginCode } from "@/lib/actions";

type Step = "email" | "code" | "sending";

export default function LoginPage() {
  const [value, setValue] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<Step>("email");
  const [touched, setTouched] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const router = useRouter();

  const valid = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value);
  const showError = touched && !valid;

  const submitEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    setError("");
    if (!valid) return;
    setBusy(true);
    try {
      const res = await checkUser(value);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      if (res.exists) {
        // Cuenta existente: código de verificación al correo → dashboard.
        const sent = await requestLoginCode(value);
        if (!sent.ok) {
          setError(sent.error);
          return;
        }
        setCodeSent(true);
        setStep("code");
      } else {
        // Cuenta nueva: magic-link real → crear contraseña y seguir el flujo.
        setStep("sending");
        const clean = value.trim().toLowerCase();
        localStorage.setItem("popconly:pending-email", clean);
        await signIn("nodemailer", {
          email: clean,
          callbackUrl: `/signup/password?email=${encodeURIComponent(clean)}`,
        });
      }
    } catch {
      setError("No pudimos conectar con el servidor. Revisa tu conexión.");
      setStep("email");
    } finally {
      setBusy(false);
    }
  };

  const submitCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (code.trim().length < 6) {
      setError("Ingresa el código de 6 dígitos.");
      return;
    }
    setBusy(true);
    try {
      const res = await signIn("credentials", {
        email: value.trim().toLowerCase(),
        code: code.trim(),
        redirect: false,
      });
      if (res?.error) {
        setError("Código incorrecto o vencido. Revisa tu correo.");
        return;
      }
      router.push("/browse");
    } finally {
      setBusy(false);
    }
  };

  const resendCode = async () => {
    setError("");
    setBusy(true);
    try {
      const sent = await requestLoginCode(value);
      if (!sent.ok) setError(sent.error);
      else setCodeSent(true);
    } finally {
      setBusy(false);
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
            Ingresa tu info para iniciar sesión
          </h1>
          <p className="text-sm text-white/60 mt-1">
            O bien, comienza con una cuenta nueva.
          </p>

          {step === "email" && (
            <form onSubmit={submitEmail} className="flex flex-col gap-1 mt-6" noValidate>
              <input
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onBlur={() => setTouched(true)}
                placeholder="Email"
                type="email"
                className={`bg-black/40 border rounded px-3 py-3 text-[15px] focus:outline-none placeholder:text-white/40 ${
                  showError ? "border-[#e50914]" : "border-white/25 focus:border-white"
                }`}
              />
              {showError && (
                <p className="text-xs text-[#ff6b6b] flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">error</span>
                  Ingresa un email válido.
                </p>
              )}
              {error && <p className="text-xs text-[#ff6b6b]">{error}</p>}
              <button
                type="submit"
                disabled={busy}
                className="mt-3 w-full py-3 rounded bg-[#e50914] hover:bg-[#f6121d] disabled:opacity-60 text-white font-semibold transition-colors cursor-pointer"
              >
                {busy ? "Verificando..." : "Continuar"}
              </button>
            </form>
          )}

          {step === "code" && (
            <form onSubmit={submitCode} className="flex flex-col gap-1 mt-6">
              <p className="text-sm text-white/70">
                Te enviamos un código de verificación a{" "}
                <strong className="text-white">{value}</strong>. Ingrésalo para entrar.
              </p>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="Código de 6 dígitos"
                inputMode="numeric"
                autoFocus
                className="mt-3 bg-black/40 border border-white/25 focus:border-white rounded px-3 py-3 text-center text-2xl font-bold tracking-[0.5em] focus:outline-none placeholder:text-white/20 placeholder:text-base placeholder:tracking-normal placeholder:font-normal"
              />
              {error && <p className="text-xs text-[#ff6b6b]">{error}</p>}
              <button
                type="submit"
                disabled={busy}
                className="mt-3 w-full py-3 rounded bg-[#e50914] hover:bg-[#f6121d] disabled:opacity-60 text-white font-semibold transition-colors cursor-pointer"
              >
                {busy ? "Verificando..." : "Entrar"}
              </button>
              <button
                type="button"
                onClick={resendCode}
                disabled={busy}
                className="mt-1 text-xs text-white/60 hover:text-white underline underline-offset-2 cursor-pointer"
              >
                Reenviar código
              </button>
              <button
                type="button"
                onClick={() => {
                  setStep("email");
                  setCode("");
                  setError("");
                }}
                className="text-xs text-white/60 hover:text-white underline underline-offset-2 cursor-pointer"
              >
                Cambiar correo
              </button>
              {codeSent && !error && (
                <p className="text-xs text-[#7ee2a8]">Código enviado. Revisa tu correo (y spam).</p>
              )}
            </form>
          )}

          {step === "sending" && (
            <p className="text-sm text-white/70 mt-6 flex items-center gap-2">
              <span className="material-symbols-outlined animate-spin">progress_activity</span>
              Enviando enlace a {value}...
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
              Si no tienes cuenta, te enviaremos un enlace de registro al
              correo que ingreses para completar tu suscripción.
            </p>
          )}

          <p className="text-[11px] text-white/40 mt-8">
            Esta página está protegida por Google reCAPTCHA para comprobar que
            no eres un robot.
          </p>
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
            <Link href="/legal" className="hover:text-white underline">Preferencias de cookies</Link>
            <Link href="/help" className="hover:text-white underline">Información empresarial</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
