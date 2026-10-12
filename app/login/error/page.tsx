"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Logo from "@/components/Logo";

const COPY: Record<string, { title: string; desc: string }> = {
  Verification: {
    title: "El enlace caducó o ya se usó",
    desc: "Los enlaces de verificación sirven una sola vez y vencen en 24 horas. Pide uno nuevo e inténtalo de nuevo: el intento anterior se olvida por completo.",
  },
  AccessDenied: {
    title: "Acceso denegado",
    desc: "No pudimos verificar tu cuenta con ese método. Intenta de nuevo o usa otro correo.",
  },
};

/** /login/error — errores de Auth.js en español (en vez de la página inglesa). */
export default function LoginErrorPage() {
  const [code, setCode] = useState("");
  useEffect(() => {
    try {
      setCode(new URLSearchParams(window.location.search).get("error") ?? "");
    } catch {
      /* sin código */
    }
  }, []);
  const copy = COPY[code] ?? {
    title: "No pudimos iniciar sesión",
    desc: "Algo falló en el proceso. Vuelve a intentarlo.",
  };
  return (
    <div className="min-h-screen bg-[#0D0D11] text-[#e4e1e7] flex flex-col">
      <header className="w-full border-b border-white/10">
        <div className="max-w-[1100px] mx-auto px-4 md:px-8 py-4">
          <Link href="/" aria-label="PopConly inicio">
            <Logo size="sm" />
          </Link>
        </div>
      </header>
      <main className="flex-1 w-full max-w-[1100px] mx-auto px-4 md:px-8 py-12 flex flex-col items-center">
        <div className="w-full max-w-md text-center flex flex-col items-center gap-4">
          <span className="w-14 h-14 rounded-full bg-[#feb700]/15 text-[#feb700] flex items-center justify-center">
            <span className="material-symbols-outlined text-3xl">link_off</span>
          </span>
          <h1 className="text-2xl font-extrabold">{copy.title}</h1>
          <p className="text-sm text-white/60">{copy.desc}</p>
          <Link
            href="/login"
            className="mt-2 px-6 py-3 rounded-md bg-[#e50914] hover:bg-[#f6121d] text-white font-semibold"
          >
            Pedir un enlace nuevo
          </Link>
        </div>
      </main>
    </div>
  );
}
