"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import Logo from "./Logo";

export function useFlowParams() {
  const [params, setParams] = useState({ email: "", plan: "" });
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    setParams({ email: sp.get("email") ?? "", plan: sp.get("plan") ?? "" });
  }, []);
  return params;
}

export function withParams(
  base: string,
  params: { email?: string; plan?: string }
) {
  const sp = new URLSearchParams();
  if (params.email) sp.set("email", params.email);
  if (params.plan) sp.set("plan", params.plan);
  const qs = sp.toString();
  return qs ? `${base}?${qs}` : base;
}

/** "Cerrar sesión" real (las páginas del flujo lo mostraban pero solo iban a /). */
export function SignOutLink() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/" })}
      className="text-sm font-semibold hover:text-white text-white/80 cursor-pointer"
    >
      Cerrar sesión
    </button>
  );
}

export default function SignupChrome({
  right,
  step,
  children,
}: {
  right?: React.ReactNode;
  step?: string;
  children: React.ReactNode;
}) {
  const { status } = useSession();
  const authed = status === "authenticated";
  // Con sesión: el logo lleva al catálogo (no al login/landing).
  const homeHref = authed ? "/browse" : "/";
  return (
    <div className="min-h-screen bg-[#0D0D11] text-[#e4e1e7] flex flex-col">
      <header className="w-full border-b border-white/10">
        <div className="max-w-[1100px] mx-auto px-4 md:px-8 py-4 flex items-center justify-between gap-4">
          <Link href={homeHref} aria-label="PopConly inicio">
            <Logo size="sm" />
          </Link>
          <div className="flex items-center gap-4">
            {step && (
              <span className="text-xs font-bold uppercase tracking-widest text-[#e7bcbc]">
                {step}
              </span>
            )}
            {right}
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-[1100px] mx-auto px-4 md:px-8 py-10 md:py-14 flex flex-col items-center">
        {children}
      </main>

      <footer className="w-full border-t border-white/10 bg-[#0e0e12]">
        <div className="max-w-[1100px] mx-auto px-4 md:px-8 py-8">
          <p className="text-xs text-white/50 mb-4">
            ¿Preguntas? Llama al 01 800 917 1564
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-white/60">
            <a href="#" className="hover:text-white">Preguntas frecuentes</a>
            <a href="#" className="hover:text-white">Centro de ayuda</a>
            <a href="#" className="hover:text-white">Términos de uso</a>
            <a href="#" className="hover:text-white">Privacidad</a>
            <a href="#" className="hover:text-white">Preferencias de cookies</a>
            <a href="#" className="hover:text-white">Información corporativa</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
