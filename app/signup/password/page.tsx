"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn, signOut, useSession } from "next-auth/react";
import SignupChrome, { useFlowParams, withParams } from "@/components/SignupChrome";
import { registerUser } from "@/lib/actions";

export default function SignupPassword() {
  const { email: initialEmail } = useFlowParams();
  const { data: session } = useSession();
  const [storedEmail, setStoredEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  // Tras el link mágico ya hay sesión: el correo sale escrito siempre.
  // Bloqueado: la cuenta se crea para ESTE correo verificado, no otro.
  const shownEmail = initialEmail || session?.user?.email || storedEmail;

  useEffect(() => {
    setStoredEmail(localStorage.getItem("popconly:pending-email") ?? "");
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      // Crea la cuenta o actualiza su contraseña y sigue el flujo normal.
      const res = await registerUser(shownEmail, password);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      const login = await signIn("credentials", {
        email: shownEmail.trim().toLowerCase(),
        password,
        redirect: false,
      });
      if (login?.error) {
        setError("Cuenta creada, pero no pudimos iniciar sesión. Ve a Iniciar sesión.");
        return;
      }
      router.push(withParams("/signup/plan", { email: shownEmail }));
    } finally {
      setBusy(false);
    }
  };

  return (
    <SignupChrome
      right={
        <Link href="/login" className="text-sm font-semibold hover:text-white text-white/80">
          Iniciar sesión
        </Link>
      }
    >
      <div className="w-full max-w-md">
        <p className="text-[11px] font-bold uppercase tracking-widest text-[#e7bcbc]">
          Paso 1 de 3
        </p>
        <h1 className="text-3xl md:text-4xl font-extrabold mt-2 leading-tight">
          Crea una contraseña para que comiences tu membresía
        </h1>
        <p className="text-sm text-white/70 mt-4">¡Unos pasos más y listo!</p>
        <p className="text-sm text-white/70">Tampoco nos gustan los trámites.</p>

        <form onSubmit={submit} className="flex flex-col gap-3 mt-6">
          <label className="flex flex-col border border-white/25 focus-within:border-[#ff5262] rounded px-3 pt-1.5 pb-2 bg-white/[0.03]">
            <span className="text-[11px] text-white/50">Email (verificado, no editable)</span>
            <input
              value={shownEmail}
              readOnly
              type="email"
              className="bg-transparent text-[15px] focus:outline-none placeholder:text-white/30 text-white/80"
              placeholder="tucorreo@ejemplo.com"
            />
          </label>
          <label className="flex flex-col border border-white/25 focus-within:border-[#ff5262] rounded px-3 pt-1.5 pb-2 bg-white/[0.03]">
            <span className="text-[11px] text-white/50">Contraseña</span>
            <span className="flex items-center gap-2">
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type={showPw ? "text" : "password"}
                className="bg-transparent text-[15px] focus:outline-none placeholder:text-white/30 flex-1"
                placeholder="Agrega una contraseña"
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="text-white/50 hover:text-white"
                aria-label={showPw ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                <span className="material-symbols-outlined text-xl">
                  {showPw ? "visibility_off" : "visibility"}
                </span>
              </button>
            </span>
          </label>
          {error && <p className="text-xs text-[#ff6b6b]">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="mt-2 w-full py-3.5 rounded-md bg-[#e50914] hover:bg-[#f6121d] disabled:opacity-60 text-white text-lg font-medium transition-colors cursor-pointer"
          >
            {busy ? "Creando tu cuenta..." : "Siguiente"}
          </button>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="text-xs text-white/50 hover:text-white underline underline-offset-4 cursor-pointer self-center"
          >
            Usar otro correo (salir y empezar de cero)
          </button>
        </form>
      </div>
    </SignupChrome>
  );
}
