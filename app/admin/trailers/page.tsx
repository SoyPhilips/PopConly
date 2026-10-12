"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Logo from "@/components/Logo";

type Stats = {
  configured: boolean;
  total: number;
  withTrailer: number;
  missingTotal: number;
  missing: string[];
};

type SyncResult = {
  slug: string;
  ok: boolean;
  videoId?: string;
  durationSecs?: number;
  persisted?: boolean;
};

function fmtDur(s?: number): string {
  if (!s || s <= 0) return "—";
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return m > 0 ? `${m} min ${String(sec).padStart(2, "0")} s` : `${sec} s`;
}

/** Panel de sincronización de trailers con YouTube Data API.
 *  Cada lote consume cuota (~101 unidades por título de 10k diarias),
 *  por eso se sincroniza de 10 en 10 y el resultado queda en Mongo + Redis. */
export default function AdminTrailersPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [last, setLast] = useState<SyncResult[]>([]);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      const r = await fetch("/api/admin/trailers");
      if (r.status === 401) {
        setError("Inicia sesión para administrar trailers.");
        return;
      }
      if (!r.ok) throw new Error();
      setStats(await r.json());
    } catch {
      setError("No se pudo cargar el estado.");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const syncBatch = async () => {
    setSyncing(true);
    setError("");
    try {
      const r = await fetch("/api/admin/trailers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ limit: 10 }),
      });
      const d = (await r.json()) as {
        results?: SyncResult[];
        error?: string;
        hint?: string;
      };
      if (!r.ok) {
        setError(d.hint ?? d.error ?? "Falló la sincronización.");
        return;
      }
      setLast(d.results ?? []);
      await load();
    } catch {
      setError("Sin conexión con el servidor.");
    } finally {
      setSyncing(false);
    }
  };

  const pct = stats && stats.total > 0 ? Math.round((stats.withTrailer / stats.total) * 100) : 0;

  return (
    <div className="min-h-screen bg-[#0D0D11] text-[#e4e1e7]">
      <header className="flex items-center justify-between px-4 md:px-8 py-4 border-b border-white/10">
        <Logo />
        <Link href="/admin/subscriptions" className="text-xs text-[#e7bcbc] hover:text-white">
          ← Pagos manuales
        </Link>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-10 flex flex-col gap-6">
        <div>
          <p className="text-[10px] text-[#ffb3b3] uppercase tracking-widest font-bold">Catálogo · Trailers</p>
          <h1 className="text-2xl font-bold">Sincronizar trailers con YouTube</h1>
          <p className="text-sm text-[#e7bcbc] mt-1">
            Busca el trailer oficial de cada carátula y guarda su duración real. La línea roja de
            “Continuar viendo” mide exactamente lo que cada perfil vio de ese trailer.
          </p>
        </div>

        {error && (
          <p className="text-sm text-[#ffb4ab] bg-[#ff5262]/10 border border-[#ff5262]/30 rounded-lg px-4 py-3">
            {error}
          </p>
        )}

        {stats && (
          <div className="bg-[#1b1b1f] rounded-xl p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between text-sm">
              <span>
                <strong>{stats.withTrailer}</strong> de <strong>{stats.total}</strong> títulos con trailer
              </span>
              <span className="text-[#ffb3b3] font-bold">{pct}%</span>
            </div>
            <div className="h-2.5 bg-[#2a292e] rounded-full overflow-hidden">
              <div className="h-full bg-[#ff5262] transition-all" style={{ width: `${pct}%` }} />
            </div>
            {!stats.configured && (
              <p className="text-xs text-[#ffdb9d]">
                Falta <code>YOUTUBE_API_KEY</code> en el servidor: sin ella no se puede buscar en YouTube.
              </p>
            )}
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={syncBatch}
                disabled={syncing || !stats.configured || stats.missingTotal === 0}
                className="px-5 py-2.5 bg-[#ff5262] hover:brightness-110 disabled:opacity-40 rounded-lg text-sm font-semibold cursor-pointer"
              >
                {syncing ? "Buscando en YouTube…" : `Sincronizar 10 trailers (${stats.missingTotal} pendientes)`}
              </button>
              <span className="text-xs text-[#e7bcbc]">Lotes de 10 por la cuota diaria de YouTube.</span>
            </div>
          </div>
        )}

        {last.length > 0 && (
          <div className="bg-[#1b1b1f] rounded-xl p-6 flex flex-col gap-2">
            <h2 className="text-sm font-semibold">Último lote</h2>
            {last.map((r) => (
              <div key={r.slug} className="flex items-center justify-between text-sm border-b border-white/5 py-2">
                <span className="font-mono text-xs">{r.slug}</span>
                {r.ok ? (
                  <span className="text-xs text-emerald-300">
                    ✓ {r.videoId} · {fmtDur(r.durationSecs)}{r.persisted === false ? " (solo caché)" : ""}
                  </span>
                ) : (
                  <span className="text-xs text-[#ffb4ab]">sin resultado</span>
                )}
              </div>
            ))}
          </div>
        )}

        {stats && stats.missing.length > 0 && (
          <div className="bg-[#1b1b1f] rounded-xl p-6">
            <h2 className="text-sm font-semibold mb-2">Pendientes (muestra)</h2>
            <p className="text-xs text-[#e7bcbc] font-mono break-all">{stats.missing.slice(0, 20).join(", ")}</p>
          </div>
        )}
      </main>
    </div>
  );
}
