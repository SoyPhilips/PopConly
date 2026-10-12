"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import SignupChrome, { SignOutLink, useFlowParams, withParams } from "@/components/SignupChrome";
import { PLANS, type PlanId } from "@/lib/plans";

const KEY_POINTS = [
  "Vuelve cuando quieras, sin compromisos",
  "Sin anuncios, disfruta sin interrupciones",
  "Cambia de plan en cualquier momento",
];

export default function SignupPlanes() {
  const { email, plan: initial } = useFlowParams();
  const { data: session } = useSession();
  const [selected, setSelected] = useState<PlanId>(
    initial === "essential" || initial === "ultra" ? initial : "plus"
  );

  return (
    <SignupChrome
      right={<SignOutLink />}
    >
      <div className="w-full max-w-4xl">
        <p className="text-[11px] font-bold uppercase tracking-widest text-[#e7bcbc] text-center">
          Paso 2 de 3
        </p>
        <h1 className="text-3xl md:text-[40px] font-extrabold mt-2 text-center">
          Planes diseñados a tu medida
        </h1>
        {session?.user?.email && (
          <p className="mt-3 mx-auto w-fit flex items-center gap-2 px-4 py-2 rounded-full bg-[#7ee2a8]/10 border border-[#7ee2a8]/30 text-xs text-[#7ee2a8]">
            <span className="material-symbols-outlined text-sm">verified</span>
            Sesión iniciada como {session.user.email} — el pago activará esta cuenta
          </p>
        )}
        <ul className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-8 mt-5">
          {KEY_POINTS.map((k) => (
            <li key={k} className="flex items-center gap-2 text-sm text-white/80">
              <span className="w-5 h-5 rounded-full bg-[#e50914]/15 text-[#e50914] flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-sm font-bold">check</span>
              </span>
              {k}
            </li>
          ))}
        </ul>

        {/* Tarjetas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-10 items-stretch">
          {PLANS.map((p) => {
            const active = selected === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setSelected(p.id)}
                className={`relative text-left rounded-2xl border p-6 pt-7 flex flex-col gap-4 transition-all hover:-translate-y-1 ${
                  active
                    ? "border-[#e50914] bg-[#e50914]/[0.07] shadow-[0_0_36px_rgba(229,9,20,0.25)]"
                    : "border-white/10 bg-[#141417] hover:border-white/30"
                }`}
              >
                {p.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-[#e50914] text-white text-[10px] font-extrabold tracking-widest whitespace-nowrap">
                    MÁS POPULAR
                  </span>
                )}
                <span className="flex items-center justify-between">
                  <span className="text-lg font-extrabold">{p.name}</span>
                  <span
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      active ? "border-[#e50914]" : "border-white/30"
                    }`}
                  >
                    {active && <span className="w-2.5 h-2.5 rounded-full bg-[#e50914]" />}
                  </span>
                </span>
                <span className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-[#e50914]">{p.price}</span>
                  <span className="text-sm text-white/50">{p.priceNote}</span>
                </span>
                <ul className="flex flex-col gap-2.5 text-sm text-white/80">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <span className="material-symbols-outlined text-[#feb700] text-lg leading-none mt-[1px]">
                        {f.toLowerCase().includes("sin descargas") ? "close" : "check_circle"}
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>
              </button>
            );
          })}
        </div>

        <p className="text-[11px] text-white/40 mt-6 leading-relaxed">
          La disponibilidad en HD, Full HD, Ultra HD (4K) y HDR depende de tu
          servicio de internet y del dispositivo en uso. Solo las personas que
          vivan contigo pueden usar tu cuenta.
        </p>

        <div className="flex justify-center mt-8">
          <Link
            href={withParams("/signup/payment", { email, plan: selected })}
            className="w-full sm:w-auto px-10 py-3.5 rounded-md bg-[#e50914] hover:bg-[#f6121d] text-white text-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            Continuar al Pago
            <span className="material-symbols-outlined">chevron_right</span>
          </Link>
        </div>
      </div>
    </SignupChrome>
  );
}
