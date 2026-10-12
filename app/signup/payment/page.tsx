"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import SignupChrome, { useFlowParams, withParams } from "@/components/SignupChrome";
import { getPlan } from "@/lib/plans";

export default function SignupPayment() {
  const { email, plan: planId } = useFlowParams();
  const { data: session } = useSession();
  const plan = getPlan(planId || "plus");
  const router = useRouter();
  const [card, setCard] = useState("");
  const [exp, setExp] = useState("");
  const [cvc, setCvc] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [pendingTx, setPendingTx] = useState<string | null>(null);
  const [reference, setReference] = useState("");
  const [reportedWompi, setReportedWompi] = useState(false);
  const wompiLinks: Record<string, string> = {
    essential: process.env.NEXT_PUBLIC_WOMPI_LINK_ESSENTIAL || "",
    plus: process.env.NEXT_PUBLIC_WOMPI_LINK_PLUS || "",
    ultra: process.env.NEXT_PUBLIC_WOMPI_LINK_ULTRA || "",
  };
  const wompiLink =
    wompiLinks[plan.id] || process.env.NEXT_PUBLIC_WOMPI_PAYMENT_LINK || "";
  // Al pagar fuera (nueva pestaña), Wompi debe devolver aquí:
  // configura en su dashboard como URL de retorno {SITE}/signup/retorno.

  const submit = async (e: React.FormEvent) => {    e.preventDefault();
    setError("");
    if (card.replace(/\s/g, "").length < 12) {
      setError("Ingresa un número de tarjeta válido.");
      return;
    }
    if (!exp || !cvc || !name.trim()) {
      setError("Completa todos los campos de pago.");
      return;
    }
    setBusy(true);
    try {
      const pubKey = process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY ?? "";
      let cardToken: string | undefined;
      if (pubKey) {
        // La tarjeta NUNCA toca nuestro servidor: se tokeniza en Wompi.
        const [mm, aa] = exp.split("/").map((s) => s.trim());
        const tokRes = await fetch(
          `${process.env.NEXT_PUBLIC_WOMPI_ENV === "production" ? "https://production.wompi.co/v1" : "https://sandbox.wompi.co/v1"}/tokens/cards`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${pubKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              number: card.replace(/\s/g, ""),
              cvc,
              exp_month: mm,
              exp_year: aa?.length === 2 ? `20${aa}` : aa,
              card_holder: name.trim(),
            }),
          }
        );
        const tok = (await tokRes.json().catch(() => null)) as {
          data?: { id?: string };
        } | null;
        if (!tokRes.ok || !tok?.data?.id) {
          setError("La tarjeta fue rechazada. Revisa los datos o usa una tarjeta de prueba.");
          return;
        }
        cardToken = tok.data.id;
      }
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: plan.id,
          cardToken,
          installments: 1,
          customerName: name.trim(),
          customerEmail: email || undefined,
        }),
      });
      const data = (await res.json().catch(() => null)) as {
        mode?: string;
        status?: string;
        error?: string;
      } | null;
      if (data?.mode === "visual") {
        router.push("/browse"); // aún sin llaves: flujo visual de siempre
        return;
      }
      if (data?.status === "APPROVED") {
        router.push("/browse");
        return;
      }
      if (data?.mode === "wompi") {
        setPendingTx(data.status ?? "PENDING");
        return;
      }
      setError("El pago no pudo procesarse. Inténtalo de nuevo.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <SignupChrome
      right={
        <Link
          href={withParams("/signup/planes", { email, plan: plan.id })}
          className="text-sm font-semibold hover:text-white text-white/80"
        >
          Cambiar plan
        </Link>
      }
    >
      <div className="w-full max-w-3xl grid grid-cols-1 md:grid-cols-5 gap-6">
        <form onSubmit={submit} className="md:col-span-3 rounded-2xl border border-white/10 bg-[#141417] p-6 flex flex-col gap-4">
          <p className="text-[11px] font-bold uppercase tracking-widest text-[#e7bcbc] -mb-2">
            Paso 3 de 3
          </p>
          <h1 className="text-2xl font-extrabold">Configura tu pago</h1>
          <p className="text-xs text-white/50 -mt-2">
            Pago seguro con Wompi: tarjeta, Nequi o PSE.
          </p>
          {session?.user?.email && (
            <p className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#7ee2a8]/10 border border-[#7ee2a8]/30 text-xs text-[#7ee2a8]">
              <span className="material-symbols-outlined text-sm">verified</span>
              Sesión iniciada como {session.user.email} — el pago activará esta cuenta
            </p>
          )}
          {wompiLink && (
            <div className="rounded-xl border border-[#e50914]/40 bg-[#e50914]/[0.06] p-4">
              <p className="font-bold text-sm">Paga en línea con Wompi</p>
              <p className="text-xs text-white/60 mt-1">
                Tarjeta, Nequi o PSE por pasarela segura. Después reporta la referencia aquí abajo.
              </p>
              <a
                href={wompiLink}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 flex items-center justify-center gap-2 w-full py-3 rounded-lg bg-white text-black font-bold hover:bg-white/90 transition-colors"
              >
                Pagar con Wompi
                <span className="material-symbols-outlined">open_in_new</span>
              </a>
            </div>
          )}
          <>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-xs text-white/60">Número de tarjeta</span>
            <input
              value={card}
              onChange={(e) => setCard(e.target.value)}
              inputMode="numeric"
              placeholder="1234 5678 9012 3456"
              className="bg-[#0e0e12] border border-white/15 focus:border-[#e50914] rounded-lg px-3 py-2.5 focus:outline-none"
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-xs text-white/60">Vencimiento</span>
              <input
                value={exp}
                onChange={(e) => setExp(e.target.value)}
                placeholder="MM/AA"
                className="bg-[#0e0e12] border border-white/15 focus:border-[#e50914] rounded-lg px-3 py-2.5 focus:outline-none"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-xs text-white/60">CVC</span>
              <input
                value={cvc}
                onChange={(e) => setCvc(e.target.value)}
                inputMode="numeric"
                placeholder="123"
                className="bg-[#0e0e12] border border-white/15 focus:border-[#e50914] rounded-lg px-3 py-2.5 focus:outline-none"
              />
            </label>
          </div>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-xs text-white/60">Nombre en la tarjeta</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Como aparece en la tarjeta"
              className="bg-[#0e0e12] border border-white/15 focus:border-[#e50914] rounded-lg px-3 py-2.5 focus:outline-none"
            />
          </label>
          {error && <p className="text-xs text-[#ff6b6b]">{error}</p>}
          {pendingTx && (
            <p className="text-xs text-[#feb700] rounded-lg bg-[#feb700]/10 px-3 py-2">
              Pago en estado {pendingTx}. Te avisaremos por correo al confirmarse.
              Puedes entrar mientras tanto.
            </p>
          )}
          <button
            type="submit"
            disabled={busy}
            className="mt-1 w-full py-3.5 rounded-md bg-[#e50914] hover:bg-[#f6121d] disabled:opacity-60 text-white text-lg font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            {busy ? "Procesando..." : "Iniciar membresía"}
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 flex flex-col gap-2">
            <p className="text-sm font-bold">¿Ya pagaste por Wompi?</p>
            <p className="text-xs text-white/60 -mt-1">
              Pega el número de aprobación para activar tu plan.
            </p>
            <input
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="N.º de aprobación de Wompi"
              className="bg-[#0e0e12] border border-white/15 focus:border-[#e50914] rounded-lg px-3 py-2.5 text-sm focus:outline-none"
            />
            {reportedWompi && (
              <p className="text-xs text-[#7ee2a8] flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">check_circle</span>
                Reporte enviado. Lo revisamos y activamos tu membresía.
              </p>
            )}
            {(reportedWompi || pendingTx) && (
              <button
                type="button"
                onClick={() => router.push("/browse")}
                className="w-full py-2.5 rounded-md bg-[#e50914] hover:bg-[#f6121d] text-white text-sm font-semibold transition-colors cursor-pointer"
              >
                Entrar al catálogo
              </button>
            )}
            <button
              type="button"
              disabled={busy}
              onClick={async () => {
                setError("");
                if (!reference.trim()) {
                  setError("Escribe el número de aprobación de tu pago.");
                  return;
                }
                setBusy(true);
                try {
                  const res = await fetch("/api/payments/manual", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      planId: plan.id,
                      reference: reference.trim(),
                      senderName: email || "wompi",
                      method: "wompi",
                    }),
                  });
                  const data = (await res.json().catch(() => null)) as {
                    mode?: string;
                  } | null;
                  if (!res.ok) {
                    setError("No pudimos registrar el reporte. Inténtalo de nuevo.");
                    return;
                  }
                  if (data?.mode === "visual-local") {
                    try {
                      const q = JSON.parse(
                        localStorage.getItem("popconly:manual-queue") ?? "[]"
                      ) as unknown[];
                      q.push({
                        planId: plan.id,
                        reference: reference.trim(),
                        senderName: email || "wompi",
                        at: Date.now(),
                      });
                      localStorage.setItem("popconly:manual-queue", JSON.stringify(q));
                    } catch {
                      /* demo */
                    }
                  }
                  setReportedWompi(true);
                } finally {
                  setBusy(false);
                }
              }}
              className="w-full py-2.5 rounded-md bg-white/10 hover:bg-white/20 text-sm font-semibold transition-colors cursor-pointer"
            >
              Reportar pago de Wompi
            </button>
          </div>
            </>
        </form>

        <aside className="md:col-span-2 rounded-2xl border border-[#e50914]/40 bg-[#e50914]/[0.05] p-6 h-fit">
          <p className="text-[11px] uppercase tracking-widest text-white/50 font-bold">
            Tu plan
          </p>
          <p className="text-xl font-extrabold mt-1">{plan.name}</p>
          <p className="mt-1">
            <span className="text-3xl font-extrabold text-[#e50914]">{plan.price}</span>
            <span className="text-sm text-white/50">{plan.priceNote}</span>
          </p>
          {email && <p className="text-xs text-white/50 mt-2 break-all">{email}</p>}
          <ul className="flex flex-col gap-2 mt-4 text-sm text-white/80">
            <li className="flex gap-2">
              <span className="material-symbols-outlined text-[#feb700] text-lg">check_circle</span>
              {plan.resolution}
            </li>
            <li className="flex gap-2">
              <span className="material-symbols-outlined text-[#feb700] text-lg">check_circle</span>
              {plan.devices}
            </li>
            <li className="flex gap-2">
              <span className="material-symbols-outlined text-[#feb700] text-lg">check_circle</span>
              {plan.downloads}
            </li>
          </ul>
        </aside>
      </div>
    </SignupChrome>
  );
}

function ReportActions() {
  const router = useRouter();
  return (
    <div className="flex flex-col sm:flex-row gap-2">
      <button
        type="button"
        onClick={() => router.push("/browse")}
        className="flex-1 py-3 rounded-md bg-[#e50914] hover:bg-[#f6121d] text-white font-semibold transition-colors cursor-pointer"
      >
        Entrar al catálogo
      </button>
      <button
        type="button"
        onClick={() => router.push("/admin/subscriptions")}
        className="flex-1 py-3 rounded-md bg-white/10 hover:bg-white/20 text-sm font-semibold transition-colors cursor-pointer"
      >
        Ver estado de mi reporte
      </button>
    </div>
  );
}
