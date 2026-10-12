"use client";

import { useState } from "react";
import Link from "next/link";
import Logo from "@/components/Logo";
import { FAQS } from "@/lib/data";

export default function HelpPage() {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<number | null>(0);
  const filtered = FAQS.filter((f) =>
    `${f.q} ${f.a}`.toLowerCase().includes(q.trim().toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#0D0D11] text-[#e4e1e7] flex flex-col">
      <header className="w-full border-b border-white/10">
        <div className="max-w-[1100px] mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
          <Link href="/" aria-label="PopConly inicio">
            <Logo size="sm" />
          </Link>
          <Link href="/browse" className="text-sm font-semibold text-white/70 hover:text-white">
            Volver al catálogo
          </Link>
        </div>
      </header>

      <main className="flex-1 w-full max-w-[900px] mx-auto px-4 md:px-8 py-12">
        <p className="text-[11px] font-bold uppercase tracking-widest text-[#e7bcbc]">
          Centro de Ayuda
        </p>
        <h1 className="text-3xl md:text-4xl font-extrabold mt-2">
          ¿En qué te ayudamos?
        </h1>

        <div className="relative mt-6">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40">
            search
          </span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Busca por planes, pagos, dispositivos..."
            className="w-full pl-11 pr-4 py-3 rounded-xl bg-[#1b1b1f] border border-white/10 focus:border-[#e50914] focus:outline-none text-sm placeholder:text-white/30"
          />
        </div>

        <div className="flex flex-col gap-3 mt-8">
          {filtered.length === 0 && (
            <p className="text-sm text-white/50">
              Sin resultados. Escríbenos a ayuda@popconly.tv.
            </p>
          )}
          {filtered.map((f) => {
            const idx = FAQS.indexOf(f);
            const isOpen = open === idx;
            return (
              <div key={f.q} className="rounded-xl bg-[#1b1b1f] border border-white/5 overflow-hidden">
                <button
                  onClick={() => setOpen(isOpen ? null : idx)}
                  className="w-full p-4 text-left flex items-center justify-between gap-3 cursor-pointer hover:bg-white/[0.02]"
                >
                  <span className="text-[15px] font-semibold">{f.q}</span>
                  <span
                    className="material-symbols-outlined text-[#ff5262] transition-transform"
                    style={{ transform: isOpen ? "rotate(180deg)" : "none" }}
                  >
                    expand_more
                  </span>
                </button>
                {isOpen && (
                  <p className="px-4 pb-4 text-sm text-white/70 leading-relaxed">{f.a}</p>
                )}
              </div>
            );
          })}
        </div>

        <div className="grid sm:grid-cols-3 gap-4 mt-10">
          {[
            { icon: "support_agent", t: "Contáctanos", d: "ayuda@popconly.tv · 24/7" },
            { icon: "devices", t: "Dispositivos", d: "Smart TV, móvil, web y consolas" },
            { icon: "payments", t: "Facturación", d: "Planes, pagos y reembolsos" },
          ].map((c) => (
            <div key={c.t} className="rounded-xl bg-[#1b1b1f] border border-white/5 p-5">
              <span className="material-symbols-outlined text-3xl text-[#ffb3b3]">{c.icon}</span>
              <p className="font-bold mt-2">{c.t}</p>
              <p className="text-xs text-white/60 mt-1">{c.d}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="border-t border-white/10">
        <div className="max-w-[1100px] mx-auto px-4 md:px-8 py-6 flex flex-wrap gap-4 text-xs text-white/50">
          <Link href="/legal" className="hover:text-white">Términos y Privacidad</Link>
          <Link href="/" className="hover:text-white">Inicio</Link>
        </div>
      </footer>
    </div>
  );
}
