"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Logo from "@/components/Logo";

type Item = {
  paymentId: string;
  planCode: string;
  amountCents: number;
  reference: string;
  senderName: string;
  createdAt: string;
  local?: boolean;
};

const LOCAL_KEY = "popconly:manual-queue";

export default function AdminSubscriptions() {
  const [authed, setAuthed] = useState(false);
  const [key, setKey] = useState("");
  const [items, setItems] = useState<Item[]>([]);
  const [localMode, setLocalMode] = useState(false);
  const [error, setError] = useState("");

  const headers = () => {
    const k = sessionStorage.getItem("popconly:admin-key") ?? "";
    return { "Content-Type": "application/json", ...(k ? { "x-admin-key": k } : {}) };
  };

  const load = useCallback(async () => {
    setError("");
    try {
      const res = await fetch("/api/admin/payments", { headers: headers() });
      if (res.status === 403) {
        setError("Clave incorrecta.");
        setAuthed(false);
        return;
      }
      const data = (await res.json()) as { billing?: boolean; items?: Item[] };
      if (!res.ok) throw new Error();
      if (!data.billing) {
        // Sin MySQL: se revisa la cola demo del mismo navegador.
        setLocalMode(true);
        try {
          const q = JSON.parse(localStorage.getItem(LOCAL_KEY) ?? "[]") as {
            planId: string;
            reference: string;
            senderName: string;
            at: number;
          }[];
          setItems(
            q.map((x, i) => ({
              paymentId: `local-${i}`,
              planCode: x.planId,
              amountCents: 0,
              reference: x.reference,
              senderName: x.senderName,
              createdAt: new Date(x.at).toLocaleString(),
              local: true,
            }))
          );
        } catch {
          setItems([]);
        }
        return;
      }
      setLocalMode(false);
      setItems(data.items ?? []);
    } catch {
      setError("No se pudo cargar. Revisa tu conexión.");
    }
  }, []);

  useEffect(() => {
    if (authed) load();
  }, [authed, load]);

  const resolve = async (paymentId: string, action: "approve" | "reject") => {
    const it = items.find((i) => i.paymentId === paymentId);
    if (it?.local) {
      try {
        const q = JSON.parse(localStorage.getItem(LOCAL_KEY) ?? "[]") as unknown[];
        q.splice(
          q.findIndex(
            (x) =>
              (x as { reference?: string }).reference === it.reference
          ),
          1
        );
        localStorage.setItem(LOCAL_KEY, JSON.stringify(q));
      } catch {
        /* demo */
      }
      setItems((prev) => prev.filter((i) => i.paymentId !== paymentId));
      return;
    }
    try {
      await fetch("/api/admin/payments", {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({ paymentId, action }),
      });
      load();
    } catch {
      setError("No se pudo actualizar.");
    }
  };

  return (
    <div className="min-h-screen bg-[#0D0D11] text-[#e4e1e7] flex flex-col">
      <header className="border-b border-white/10">
        <div className="max-w-[1100px] mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
          <Link href="/" aria-label="PopConly inicio">
            <Logo size="sm" />
          </Link>
          <span className="text-xs font-bold uppercase tracking-widest text-[#e7bcbc]">
            Admin · Suscripciones
          </span>
        </div>
      </header>

      <main className="flex-1 w-full max-w-[1100px] mx-auto px-4 md:px-8 py-10">
        {!authed ? (
          <div className="max-w-sm mx-auto rounded-2xl border border-white/10 bg-[#141417] p-6">
            <h1 className="text-xl font-extrabold">Acceso admin</h1>
            <p className="text-xs text-white/50 mt-1">
              Pide la clave una vez por navegador. En desarrollo sin ADMIN_KEY entra directo.
            </p>
            <input
              value={key}
              onChange={(e) => setKey(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  sessionStorage.setItem("popconly:admin-key", key);
                  setAuthed(true);
                }
              }}
              type="password"
              placeholder="Clave admin (vacío en dev)"
              className="mt-4 w-full bg-[#0e0e12] border border-white/15 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#e50914]"
            />
            {error && <p className="text-xs text-[#ff6b6b] mt-2">{error}</p>}
            <button
              onClick={() => {
                sessionStorage.setItem("popconly:admin-key", key);
                setAuthed(true);
              }}
              className="mt-3 w-full py-2.5 rounded-lg bg-[#e50914] hover:bg-[#f6121d] font-semibold text-sm cursor-pointer"
            >
              Entrar
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-extrabold">Pagos por revisar</h1>
                <p className="text-xs text-white/50">
                  {localMode
                    ? "Modo demo local (sin MySQL): reportes de este navegador."
                    : "Reportes Nequi pendientes de MySQL."}
                </p>
              </div>
              <button
                onClick={load}
                className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm font-semibold cursor-pointer"
              >
                Recargar
              </button>
            </div>
            {error && <p className="text-xs text-[#ff6b6b] mb-4">{error}</p>}
            {items.length === 0 ? (
              <p className="text-sm text-white/50 rounded-xl bg-[#1b1b1f] p-8 text-center">
                No hay pagos pendientes. Cuando alguien reporte su Nequi aparece aquí.
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {items.map((it) => (
                  <div
                    key={it.paymentId}
                    className="rounded-xl bg-[#1b1b1f] border border-white/10 p-4 flex flex-col sm:flex-row sm:items-center gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-bold truncate">{it.senderName}</p>
                      <p className="text-xs text-white/60">
                        Ref: <span className="text-white font-mono">{it.reference}</span>
                        {" · "}Plan {it.planCode} · {it.createdAt}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => resolve(it.paymentId, "approve")}
                        className="px-4 py-2 rounded-lg bg-[#7ee2a8]/15 text-[#7ee2a8] hover:bg-[#7ee2a8] hover:text-black text-sm font-bold cursor-pointer"
                      >
                        Aprobar
                      </button>
                      <button
                        onClick={() => resolve(it.paymentId, "reject")}
                        className="px-4 py-2 rounded-lg bg-white/10 hover:bg-[#e50914] text-sm font-semibold cursor-pointer"
                      >
                        Rechazar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
