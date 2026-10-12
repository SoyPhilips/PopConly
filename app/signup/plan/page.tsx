"use client";

import Link from "next/link";
import SignupChrome, { SignOutLink, useFlowParams, withParams } from "@/components/SignupChrome";

const CHECKS = [
  "Sin compromisos, cancela cuando quieras.",
  "Todo PopConly a un bajo costo.",
  "Disfruta sin límites en todos tus dispositivos.",
];

export default function SignupPlanIntro() {
  const { email } = useFlowParams();
  return (
    <SignupChrome
      right={<SignOutLink />}
    >
      <div className="flex flex-col items-center text-center max-w-md w-full">
        <span className="w-12 h-12 rounded-full border-2 border-[#e50914] text-[#e50914] flex items-center justify-center mb-6">
          <span className="material-symbols-outlined text-3xl">check</span>
        </span>
        <p className="text-[11px] font-bold uppercase tracking-widest text-[#e7bcbc]">
          Paso 2 de 3
        </p>
        <h1 className="text-3xl md:text-4xl font-extrabold mt-2">
          Selecciona tu plan
        </h1>
        <ul className="flex flex-col gap-4 mt-8 text-left w-full max-w-sm">
          {CHECKS.map((c) => (
            <li key={c} className="flex items-start gap-3">
              <span className="material-symbols-outlined text-[#e50914] text-3xl leading-none">
                check
              </span>
              <span className="text-[15px]">{c}</span>
            </li>
          ))}
        </ul>
        <Link
          href={withParams("/signup/planes", { email })}
          className="mt-8 w-full max-w-sm py-3.5 rounded-md bg-[#e50914] hover:bg-[#f6121d] text-white text-lg font-medium transition-colors text-center"
        >
          Siguiente
        </Link>
      </div>
    </SignupChrome>
  );
}
