"use client";

import Link from "next/link";
import SignupChrome, { useFlowParams, withParams } from "@/components/SignupChrome";

export default function SignupStep1() {
  const { email } = useFlowParams();
  return (
    <SignupChrome
      right={
        <Link href="/login" className="text-sm font-semibold hover:text-white text-white/80">
          Iniciar sesión
        </Link>
      }
    >
      <div className="flex flex-col items-center text-center max-w-md w-full">
        <div className="flex items-center gap-4 mb-8 text-[#ff5262]">
          <span className="material-symbols-outlined text-5xl font-light">laptop_mac</span>
          <span className="material-symbols-outlined text-6xl font-light">tv</span>
          <span className="material-symbols-outlined text-5xl font-light">smartphone</span>
        </div>
        <p className="text-[11px] font-bold uppercase tracking-widest text-[#e7bcbc]">
          Paso 1 de 3
        </p>
        <h1 className="text-3xl md:text-4xl font-extrabold mt-2">
          Completa la configuración de tu cuenta
        </h1>
        <p className="text-sm text-white/70 mt-4 max-w-sm">
          PopConly está personalizado para ti. Crea una contraseña para ver
          PopConly en cualquier dispositivo, cuando quieras.
        </p>
        {email && (
          <p className="text-xs text-white/50 mt-3">
            Continuando como <span className="text-white font-semibold">{email}</span>
          </p>
        )}
        <Link
          href={withParams("/signup/password", { email })}
          className="mt-8 w-full max-w-sm py-3.5 rounded-md bg-[#e50914] hover:bg-[#f6121d] text-white text-lg font-medium transition-colors text-center"
        >
          Siguiente
        </Link>
      </div>
    </SignupChrome>
  );
}
