"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import SignupChrome from "@/components/SignupChrome";

/** /signup/retorno — a dónde vuelve el usuario tras pagar en Wompi.
 *  Configúrala como URL de retorno en el dashboard de Wompi
 *  (producción: https://popconly.com/signup/retorno).
 *  Consulta el estado de la membresía y entra al catálogo al activarse. */
export default function SignupRetorno() {
  const router = useRouter();
  const [state, setState] = useState<"checking" | "active" | "pending">("checking");
  const [tries, setTries] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let n = 0;
    const id = setInterval(async () => {
      n += 1;
      if (!cancelled) setTries(n);
      try {
        const r = await fetch("/api/me/subscription");
        if (!r.ok) return;
        const sub = (await r.json()) as { active?: boolean; billing?: boolean };
        if (!cancelled && sub.billing && sub.active) {
          clearInterval(id);
          if (!cancelled) {
            setState("active");
            setTimeout(() => {
              if (!cancelled) router.push("/browse");
            }, 1200);
          }
        } else if (n >= 24 && !cancelled) {
          // ~2 min esperando al webhook: queda pendiente con aviso.
          clearInterval(id);
          setState("pending");
        }
      } catch {
        /* reintenta */
      }
    }, 5000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [router]);

  return (
    <SignupChrome>
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#141417] p-8 flex flex-col items-center text-center gap-4">
        {state === "active" ? (
          <>
            <span className="w-14 h-14 rounded-full bg-[#7ee2a8]/15 text-[#7ee2a8] flex items-center justify-center">
              <span className="material-symbols-outlined text-3xl">check_circle</span>
            </span>
            <h1 className="text-2xl font-extrabold">¡Pago confirmado!</h1>
            <p className="text-sm text-white/60">Tu membresía está activa. Entrando al catálogo…</p>
          </>
        ) : state === "pending" ? (
          <>
            <span className="w-14 h-14 rounded-full bg-[#feb700]/15 text-[#feb700] flex items-center justify-center">
              <span className="material-symbols-outlined text-3xl">schedule</span>
            </span>
            <h1 className="text-2xl font-extrabold">Estamos confirmando tu pago</h1>
            <p className="text-sm text-white/60">
              Wompi aún no nos avisa. Te escribiremos al confirmarse; puedes
              entrar mientras tanto.
            </p>
            <div className="flex flex-col w-full gap-2 mt-2">
              <Link
                href="/browse"
                className="w-full py-3 rounded-md bg-[#e50914] hover:bg-[#f6121d] text-white font-semibold text-center"
              >
                Entrar al catálogo
              </Link>
              <Link
                href="/signup/payment"
                className="w-full py-2.5 rounded-md bg-white/10 hover:bg-white/20 text-sm font-semibold text-center"
              >
                Reportar mi pago
              </Link>
            </div>
          </>
        ) : (
          <>
            <span className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-3xl animate-spin">progress_activity</span>
            </span>
            <h1 className="text-2xl font-extrabold">Verificando tu pago…</h1>
            <p className="text-sm text-white/60">
              Esperando la confirmación de Wompi ({tries * 5}s). No cierres esta ventana.
            </p>
          </>
        )}
      </div>
    </SignupChrome>
  );
}
