"use client";

import { useState } from "react";
import Link from "next/link";
import Logo from "@/components/Logo";

const TABS = ["Términos de Uso", "Privacidad", "Cookies"] as const;

const CONTENT: Record<(typeof TABS)[number], { t: string; d: string }[]> = {
  "Términos de Uso": [
    {
      t: "1. Tu membresía PopConly",
      d: "Tu membresía se renueva automáticamente cada mes hasta que la canceles desde tu cuenta. Puedes cancelar en cualquier momento sin penalizaciones y seguirás teniendo acceso hasta el fin del periodo facturado.",
    },
    {
      t: "2. Uso permitido",
      d: "Solo las personas que vivan contigo pueden usar tu cuenta, dentro del límite de pantallas simultáneas de tu plan. Está prohibido revender, compartir públicamente o extraer el catálogo.",
    },
    {
      t: "3. Contenido y disponibilidad",
      d: "El catálogo varía por región y en el tiempo. La calidad (HD, Full HD, 4K, HDR, Dolby Atmos) depende de tu plan, tu conexión y tu dispositivo.",
    },
  ],
  Privacidad: [
    {
      t: "1. Qué datos recogemos",
      d: "Email, datos de pago (procesados por proveedores certificados), historial de reproducción y datos técnicos del dispositivo para mejorar las recomendaciones.",
    },
    {
      t: "2. Para qué los usamos",
      d: "Operar tu cuenta, personalizar recomendaciones, prevenir fraude y, con tu consentimiento, enviarte novedades. Nunca vendemos tus datos personales.",
    },
    {
      t: "3. Tus derechos",
      d: "Puedes solicitar acceso, rectificación o eliminación de tus datos escribiendo a privacidad@popconly.tv.",
    },
  ],
  Cookies: [
    {
      t: "1. Cookies necesarias",
      d: "Mantienen tu sesión iniciada y recuerdan tu idioma y tu plan. Sin ellas la plataforma no funciona correctamente.",
    },
    {
      t: "2. Cookies de medición",
      d: "Nos ayudan a entender qué contenido funciona mejor, de forma agregada y anónima. Puedes desactivarlas desde tu navegador.",
    },
  ],
};

export default function LegalPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]>(TABS[0]);

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
          Legal
        </p>
        <h1 className="text-3xl md:text-4xl font-extrabold mt-2">
          Términos y políticas
        </h1>

        <div className="flex gap-2 mt-6">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                tab === t
                  ? "bg-[#e50914] text-white"
                  : "bg-[#1b1b1f] text-white/60 hover:text-white"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-4 mt-8">
          {CONTENT[tab].map((s) => (
            <section key={s.t} className="rounded-xl bg-[#1b1b1f] border border-white/5 p-5">
              <h2 className="font-bold">{s.t}</h2>
              <p className="text-sm text-white/70 mt-2 leading-relaxed">{s.d}</p>
            </section>
          ))}
        </div>
        <p className="text-[11px] text-white/40 mt-6">
          Última actualización: mayo 2025. Documento informativo de demostración.
        </p>
      </main>

      <footer className="border-t border-white/10">
        <div className="max-w-[1100px] mx-auto px-4 md:px-8 py-6 flex flex-wrap gap-4 text-xs text-white/50">
          <Link href="/help" className="hover:text-white">Centro de Ayuda</Link>
          <Link href="/" className="hover:text-white">Inicio</Link>
        </div>
      </footer>
    </div>
  );
}
