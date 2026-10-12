"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import BrowseHeader from "@/components/BrowseHeader";
import BrowseFooter from "@/components/BrowseFooter";
import { PROFILE_PHOTO_URL } from "@/lib/images";
import { PLANS } from "@/lib/plans";
import { loadMyList } from "@/lib/myListStore";
import { getActiveProfile, setActiveProfile as persistActiveProfile } from "@/lib/activeProfile";

type DbProfile = { id: string; name: string; kind: string };

const FALLBACK_PROFILES = [
  { name: "Principal", sub: "Perfil principal", subClass: "text-[#e7bcbc]", kind: "photo" },
  { name: "Kids", sub: "Niños / Kids", subClass: "text-[#c9bfff]", kind: "kids" },
];

const DEVICES_INIT = [
  { icon: "laptop", title: "Este dispositivo", sub: "Sesión actual del navegador", activity: "En uso ahora", live: true },
];

function profileVisual(kind: string) {
  if (kind === "kids") return { icon: "sentiment_very_satisfied", cls: "text-[#c9bfff]" };
  if (kind === "shared") return { icon: "local_movies", cls: "text-[#ffdb9d]" };
  if (kind === "photo") return { icon: "", cls: "" };
  return { icon: "person", cls: "text-[#e7bcbc]" };
}

export default function ProfilePage() {
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState("");
  const [editing, setEditing] = useState(false);
  const [activeProfile, setActiveProfile] = useState("");
  const [dbProfiles, setDbProfiles] = useState<DbProfile[] | null>(null);
  const [profilesDone, setProfilesDone] = useState(false);
  const [addingProfile, setAddingProfile] = useState(false);
  const [newProfileName, setNewProfileName] = useState("");
  const [sub, setSub] = useState<{
    billing: boolean;
    active: boolean;
    planCode: string | null;
    currentPeriodEnd: string | null;
    payment: { method: string | null; brand: string | null; last4: string | null } | null;
  } | null>(null);
  const [myListCount, setMyListCount] = useState(0);
  const [plan, setPlan] = useState<"Premium" | "Estandar">("Premium");
  const [autoNext, setAutoNext] = useState(true);
  const [wifiOnly, setWifiOnly] = useState(true);
  const [devices] = useState(DEVICES_INIT);
  const { data: session } = useSession();

  // El nombre visible es el del perfil activo en la DB (persiste al recargar).
  const activeDb =
    dbProfiles?.find((p) => p.name === activeProfile) ?? null;
  const displayName =
    activeDb?.name || session?.user?.name || session?.user?.email?.split("@")[0] || "Mi cuenta";
  const displayEmail = session?.user?.email ?? "";

  const startEditing = () => {
    setDraft(displayName);
    setEditing(true);
  };

  // Guarda el nombre en la base de datos del perfil (PUT /api/profiles).
  const saveName = async () => {
    setEditing(false);
    const clean = draft.trim().slice(0, 24);
    if (!clean || !activeDb || clean === activeDb.name) return;
    try {
      const r = await fetch("/api/profiles", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: activeDb.id, name: clean }),
      });
      if (!r.ok) return; // duplicado o error: se conserva el anterior
      setDbProfiles((prev) =>
        (prev ?? []).map((p) => (p.id === activeDb.id ? { ...p, name: clean } : p))
      );
      setActiveProfile(clean);
      persistActiveProfile(clean);
    } catch {
      /* sin conexión: se conserva el anterior */
    }
  };

  // Sincroniza: perfiles reales, plan real y conteo de Mi Lista.
  useEffect(() => {
    setMyListCount(loadMyList().length);
    (async () => {
      try {
        const r = await fetch("/api/profiles");
        if (r.ok) {
          const d = (await r.json()) as { profiles?: DbProfile[] };
          if (Array.isArray(d.profiles) && d.profiles.length > 0) {
            setDbProfiles(d.profiles);
            const first = d.profiles[0];
            // Respeta el perfil que ya estaba activo en este navegador.
            const saved = getActiveProfile();
            const match = d.profiles.find((p) => p.name === saved) ?? first;
            if (match) {
              setActiveProfile(match.name);
              persistActiveProfile(match.name);
            }
            setProfilesDone(true);
            return;
          }
        }
      } catch {
        /* lista demo local */
      }
      setDbProfiles(null);
      setActiveProfile((a) => {
        const next = a || getActiveProfile() || FALLBACK_PROFILES[0].name;
        persistActiveProfile(next);
        return next;
      });
      setProfilesDone(true);
    })();
    (async () => {
      try {
        const r = await fetch("/api/me/subscription");
        if (r.ok) setSub(await r.json());
      } catch {
        /* sin facturación */
      }
    })();
  }, []);

  const profiles: { name: string; kind: string; sub: string; subClass: string }[] = (
    dbProfiles ?? FALLBACK_PROFILES
  ).map((p) => ({
    name: p.name,
    kind: p.kind,
    sub: "sub" in p && typeof p.sub === "string" ? p.sub : "Perfil",
    subClass:
      "subClass" in p && typeof p.subClass === "string" ? p.subClass : "text-[#e7bcbc]",
  }));

  const realPlan = sub?.billing && sub.active
    ? PLANS.find((p) => p.id === sub.planCode) ?? null
    : null;

  // Método de pago real (viene de Wompi/MySQL). Sin datos = texto honesto.
  const pay = sub?.payment ?? null;
  const payLabel = !pay || (!pay.method && !pay.brand && !pay.last4)
    ? null
    : pay.method === "NEQUI"
      ? "Nequi"
      : pay.method === "CARD" || pay.brand || pay.last4
        ? `${pay.brand ? pay.brand.charAt(0) + pay.brand.slice(1).toLowerCase() : "Tarjeta"}${pay.last4 ? ` •••• ${pay.last4}` : ""}`
        : pay.method
          ? pay.method.charAt(0) + pay.method.slice(1).toLowerCase()
          : null;

  const periodLabel = sub?.currentPeriodEnd
    ? new Date(sub.currentPeriodEnd).toLocaleDateString("es-CO", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  const selectProfile = (name: string) => {
    setActiveProfile(name);
    persistActiveProfile(name);
  };

  const createProfile = async () => {
    const clean = newProfileName.trim().slice(0, 24);
    if (!clean) return;
    try {
      const r = await fetch("/api/profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: clean }),
      });
      if (r.ok) {
        const created = (await r.json()) as DbProfile;
        setDbProfiles((prev) => [...(prev ?? []), created]);
        selectProfile(created.name);
      }
    } catch {
      /* sin conexión */
    }
    setNewProfileName("");
    setAddingProfile(false);
  };

  return (
    <div className="w-full min-h-screen bg-[#0D0D11] text-[#e4e1e7]">
      <BrowseHeader query={query} onQueryChange={setQuery} />

      <div className="relative w-full overflow-hidden pb-16">
        <div className="absolute -top-32 -left-20 w-96 h-96 bg-[#ff5262]/15 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-80 right-0 w-[30rem] h-[30rem] bg-[#917eff]/10 rounded-full blur-[140px] pointer-events-none" />

        <div className="w-full px-4 md:px-8 lg:px-14 max-w-[1720px] mx-auto flex flex-col gap-10 pt-24">
          {/* Encabezado de Perfil Principal */}
          <section className="relative w-full bg-[#1b1b1f] rounded-xl p-6 md:p-10 overflow-hidden shadow-xl">
            <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-[#ff5262]/10 via-transparent to-transparent pointer-events-none" />
            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                <div className="relative flex-shrink-0">
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden p-1 bg-gradient-to-tr from-[#ff5262] via-[#353439] to-[#feb700] shadow-[0_0_24px_rgba(255,82,98,0.35)]">
                    <img alt={`Avatar de ${displayName}`} className="w-full h-full rounded-full object-cover" src={session?.user?.image || PROFILE_PHOTO_URL} />
                  </div>
                  <span className="absolute bottom-1 right-1 flex items-center justify-center w-7 h-7 bg-[#0e0e12] text-[#feb700] rounded-full shadow-md" title="Cuenta Verificada">
                    <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-3">
                    {editing ? (
                      <input
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        onBlur={saveName}
                        onKeyDown={(e) => e.key === "Enter" && saveName()}
                        autoFocus
                        placeholder={displayName}
                        maxLength={24}
                        className="bg-[#0e0e12] border border-white/20 rounded-lg px-3 py-1 text-[28px] font-bold focus:outline-none focus:border-[#ff5262]"
                      />
                    ) : (
                      <h1 className="text-[28px] font-bold tracking-tight">{displayName}</h1>
                    )}
                    <span className="px-2.5 py-1 bg-[#2a292e] rounded-full text-[10px] font-semibold text-[#feb700] flex items-center gap-1 shadow-sm">
                      <span className="material-symbols-outlined text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>stars</span>
                      Miembro VIP desde 2023
                    </span>
                  </div>
                  <p className="text-sm text-[#e7bcbc]">{displayEmail}</p>
                  <div className="flex items-center gap-4 pt-1 text-[#e7bcbc] text-xs font-semibold">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">bookmark_added</span> {myListCount} en Mi Lista
                    </span>
                    {realPlan && (
                      <>
                        <span className="w-1 h-1 rounded-full bg-white/30" />
                        <span className="flex items-center gap-1 text-[#ffb3b3]">
                          <span className="material-symbols-outlined text-sm">verified</span> Plan {realPlan.name}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                <button
                  onMouseDown={(e) => {
                    // No soltar el foco: evita que onBlur guarde dos veces.
                    if (editing) e.preventDefault();
                  }}
                  onClick={() => (editing ? saveName() : startEditing())}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-[#1f1f23] hover:bg-[#39393d] rounded-lg text-sm font-semibold transition-all shadow-md"
                >
                  <span className="material-symbols-outlined text-lg">edit</span>
                  Editar perfil
                </button>
                <button className="flex items-center justify-center w-11 h-11 bg-[#1f1f23] hover:bg-[#39393d] rounded-lg transition-colors" title="Compartir perfil">
                  <span className="material-symbols-outlined text-xl">share</span>
                </button>
              </div>
            </div>
          </section>

          {/* Selector de Perfiles */}
          <section className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[10px] text-[#ffb3b3] uppercase tracking-widest font-bold">Experiencia Multiusuario</span>
                <h2 className="text-xl font-semibold">¿Quién está viendo?</h2>
              </div>
              <button className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1b1b1f] hover:bg-[#1f1f23] text-[#e7bcbc] hover:text-white rounded-lg text-xs font-semibold transition-colors">
                <span className="material-symbols-outlined text-base">manage_accounts</span>
                Administrar perfiles
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4">
              {!profilesDone ? (
                [0, 1].map((i) => (
                  <div key={i} className="flex flex-col items-center gap-3 p-4 bg-[#1b1b1f] rounded-xl animate-pulse">
                    <span className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-[#353439]" />
                    <span className="flex flex-col items-center gap-1.5 w-full">
                      <span className="h-4 w-16 rounded bg-[#353439]" />
                      <span className="h-3 w-12 rounded bg-[#353439]" />
                    </span>
                  </div>
                ))
              ) : (
              profiles.map((p) => {
                const active = activeProfile === p.name;
                const vis = profileVisual(p.kind);
                return (
                  <button
                    key={p.name}
                    onClick={() => selectProfile(p.name)}
                    className={`group relative flex flex-col items-center gap-3 p-4 rounded-xl cursor-pointer transition-all duration-300 shadow-lg shadow-black/40 ${
                      active ? "bg-[#2a292e]" : "bg-[#1b1b1f] hover:bg-[#1f1f23]"
                    }`}
                  >
                    <span className={`relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden p-1 ${
                      active
                        ? "bg-gradient-to-b from-[#ff5262] to-[#353439] shadow-[0_0_20px_rgba(255,82,98,0.4)]"
                        : "bg-[#353439]"
                    }`}>
                      {p.kind === "photo" ? (
                        <img alt={p.name} className="w-full h-full rounded-lg object-cover group-hover:scale-105 transition-transform duration-300" src={PROFILE_PHOTO_URL} />
                      ) : (
                        <span className="w-full h-full rounded-lg bg-[#353439] flex items-center justify-center">
                          <span className={`material-symbols-outlined text-4xl ${vis.cls}`}>
                            {vis.icon}
                          </span>
                        </span>
                      )}
                      {active && <span className="absolute bottom-1 right-1 w-3 h-3 bg-[#ff5262] rounded-full ring-2 ring-[#0e0e12]" />}
                    </span>
                    <span className="flex flex-col items-center text-center">
                      <span className="text-base font-semibold">{p.name}</span>
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${active ? "text-[#ffb3b3]" : p.subClass}`}>{active ? "Activo ahora" : p.sub}</span>
                    </span>
                  </button>
                );
              })
              )
              }
              {addingProfile ? (
                <div className="flex flex-col items-center justify-center gap-3 p-4 bg-[#1b1b1f] rounded-xl">
                  <input
                    value={newProfileName}
                    onChange={(e) => setNewProfileName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") createProfile();
                      if (e.key === "Escape") {
                        setAddingProfile(false);
                        setNewProfileName("");
                      }
                    }}
                    placeholder="Nombre del perfil"
                    autoFocus
                    maxLength={24}
                    className="w-full bg-[#0e0e12] border border-white/20 rounded-lg px-3 py-2 text-sm text-center focus:outline-none focus:border-[#ff5262]"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={createProfile}
                      className="px-4 py-1.5 rounded-lg bg-[#ff5262] text-sm font-semibold cursor-pointer"
                    >
                      Crear
                    </button>
                    <button
                      onClick={() => {
                        setAddingProfile(false);
                        setNewProfileName("");
                      }}
                      className="px-4 py-1.5 rounded-lg bg-white/10 text-sm cursor-pointer"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setAddingProfile(true)}
                  className="flex flex-col items-center justify-center gap-3 p-4 bg-[#0e0e12]/60 hover:bg-[#1b1b1f] rounded-xl cursor-pointer transition-all duration-200 group"
                >
                  <span className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-[#1b1b1f] flex items-center justify-center group-hover:bg-[#ff5262]/20 group-hover:text-[#ffb3b3] transition-all">
                    <span className="material-symbols-outlined text-3xl text-[#e7bcbc] group-hover:text-[#ffb3b3]">add</span>
                  </span>
                  <span className="text-base text-[#e7bcbc] group-hover:text-white">Añadir perfil</span>
                </button>
              )}
            </div>
          </section>

          {/* Paneles */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 flex flex-col gap-6">
              {/* Plan y Facturación */}
              <section className="flex flex-col gap-4 bg-[#1b1b1f] p-6 md:p-10 rounded-xl shadow-lg">
                <div className="flex items-center justify-between pb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-[#ff5262]/20 flex items-center justify-center text-[#ff5262]">
                      <span className="material-symbols-outlined text-xl">credit_card</span>
                    </div>
                    <div>
                      <h3 className="text-base font-semibold">Plan y Facturación</h3>
                      <p className="text-xs text-[#e7bcbc]">Gestiona tu suscripción activa y métodos de pago</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#ff5262] text-white text-[10px] font-bold uppercase tracking-wider">Activo</span>
                </div>
                {realPlan ? (
                  <div className="relative overflow-hidden bg-[#1f1f23] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-semibold">{realPlan.name}</span>
                        <span className="px-2 py-0.5 rounded bg-[#2a292e] text-[10px] text-[#ffb3b3] font-bold">4K HDR</span>
                      </div>
                      <p className="text-xs text-[#e7bcbc]">{realPlan.resolution} · {realPlan.devices}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-base font-bold">{realPlan.price}</span>
                        <span className="text-xs text-[#e7bcbc]">{realPlan.priceNote}</span>
                      </div>
                      {sub?.currentPeriodEnd && (
                        <span className="text-[11px] text-[#e7bcbc]">
                          Vigente hasta {new Date(sub.currentPeriodEnd).toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" })}
                        </span>
                      )}
                    </div>
                    <Link
                      href="/signup/planes"
                      className="px-4 py-2 bg-[#ff5262] hover:brightness-110 text-white rounded-lg text-sm font-semibold transition-colors whitespace-nowrap shadow-[0_4px_16px_rgba(255,82,98,0.3)] text-center"
                    >
                      Cambiar plan
                    </Link>
                  </div>
                ) : sub?.billing && !sub.active ? (
                  <div className="bg-[#1f1f23] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-base font-semibold">Sin membresía activa</span>
                      <p className="text-xs text-[#e7bcbc]">Elige un plan para seguir viendo sin límites.</p>
                    </div>
                    <Link
                      href="/signup/planes"
                      className="px-4 py-2 bg-[#ff5262] hover:brightness-110 text-white rounded-lg text-sm font-semibold whitespace-nowrap text-center"
                    >
                      Ver planes
                    </Link>
                  </div>
                ) : (
                  <div className="relative overflow-hidden bg-[#1f1f23] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-semibold">
                          {plan === "Premium" ? "PopConly Premium" : "PopConly Estándar"}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-[#2a292e] text-[10px] text-[#ffb3b3] font-bold">4K HDR</span>
                      </div>
                      <p className="text-xs text-[#e7bcbc]">
                        {plan === "Premium"
                          ? "Calidad Ultra HD + Dolby Atmos en hasta 4 pantallas simultáneas"
                          : "Calidad Full HD en hasta 2 pantallas simultáneas"}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-base font-bold">{plan === "Premium" ? "$12.99" : "$4.99"}</span>
                        <span className="text-xs text-[#e7bcbc]">/ mes</span>
                      </div>
                    </div>
                    <button
                      onClick={() => setPlan((p) => (p === "Premium" ? "Estandar" : "Premium"))}
                      className="px-4 py-2 bg-[#ff5262] hover:brightness-110 text-white rounded-lg text-sm font-semibold transition-colors whitespace-nowrap shadow-[0_4px_16px_rgba(255,82,98,0.3)] cursor-pointer"
                    >
                      Cambiar plan
                    </button>
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div className="p-4 bg-[#2a292e] rounded-lg flex flex-col gap-1">
                    <span className="text-[10px] text-[#e7bcbc] uppercase tracking-wider">Próxima Facturación</span>
                    <span className="text-base font-bold">{periodLabel ?? "—"}</span>
                    <span className="text-xs text-[#e7bcbc]">
                      {periodLabel ? "Vigencia de tu membresía actual" : "Sin membresía activa"}
                    </span>
                  </div>
                  <div className="p-4 bg-[#2a292e] rounded-lg flex flex-col gap-1">
                    <span className="text-[10px] text-[#e7bcbc] uppercase tracking-wider">Método de Pago Predeterminado</span>
                    {payLabel ? (
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[#ffdb9d] text-2xl">credit_card</span>
                        <span className="text-base font-semibold">{payLabel}</span>
                      </div>
                    ) : (
                      <span className="text-sm text-[#e7bcbc]">Sin método registrado (pago por link Wompi)</span>
                    )}
                    <span className="text-xs text-[#e7bcbc]">Se sincroniza con tu pago en Wompi</span>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <Link href="/help" className="text-xs text-[#e7bcbc] hover:text-white flex items-center gap-1 transition-colors">
                    <span className="material-symbols-outlined text-base">receipt_long</span>
                    Historial de facturas
                  </Link>
                  <Link href="/help" className="text-xs text-[#ffb3b3] hover:text-white flex items-center gap-1 transition-colors">
                    Actualizar forma de pago
                  </Link>
                </div>
              </section>

              {/* Ajustes de Reproducción */}
              <section className="flex flex-col gap-4 bg-[#1b1b1f] p-6 md:p-10 rounded-xl shadow-lg">
                <div className="flex items-center gap-3 pb-2">
                  <div className="w-9 h-9 rounded-lg bg-[#917eff]/20 flex items-center justify-center text-[#c9bfff]">
                    <span className="material-symbols-outlined text-xl">tune</span>
                  </div>
                  <div>
                    <h3 className="text-base font-semibold">Ajustes de Reproducción</h3>
                    <p className="text-xs text-[#e7bcbc]">Configuración de audio, video y descargas de este perfil</p>
                  </div>
                </div>
                <div className="flex flex-col gap-1 p-4 bg-[#1f1f23] rounded-lg">
                  <label className="text-sm font-semibold flex items-center justify-between">
                    <span>Calidad de Streaming y Audio</span>
                    <span className="text-[10px] text-[#ffb3b3] font-bold">Auto adaptativo</span>
                  </label>
                  <div className="flex items-center justify-between gap-4 mt-1">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#feb700]">high_quality</span>
                      <span className="text-sm font-semibold">Máxima (4K Ultra HD &amp; Dolby Atmos)</span>
                    </div>
                    <button className="px-3 py-1.5 bg-[#2a292e] hover:bg-[#39393d] rounded text-xs font-semibold transition-colors">
                      Modificar
                    </button>
                  </div>
                  <p className="text-xs text-[#e7bcbc] mt-1">Usa hasta 7.0 GB por hora de reproducción en red Wi-Fi o cableada.</p>
                </div>
                <div className="flex flex-col gap-3">
                  {[
                    { t: "Descarga automática de siguientes episodios", d: "Elimina el episodio visto y descarga el siguiente cuando estés en Wi-Fi.", v: autoNext, s: setAutoNext },
                    { t: "Descargar únicamente por Wi-Fi", d: "Evita el consumo innecesario del paquete de datos móviles en tu dispositivo.", v: wifiOnly, s: setWifiOnly },
                  ].map((row) => (
                    <div key={row.t} className="flex items-center justify-between p-4 bg-[#1f1f23] rounded-lg">
                      <div className="flex flex-col pr-4">
                        <span className="text-sm font-semibold">{row.t}</span>
                        <span className="text-xs text-[#e7bcbc]">{row.d}</span>
                      </div>
                      <button
                        onClick={() => row.s(!row.v)}
                        aria-pressed={row.v}
                        className={`relative inline-flex items-center cursor-pointer flex-shrink-0 w-12 h-6 rounded-full transition-colors ${row.v ? "bg-[#ff5262]" : "bg-[#353439]"}`}
                      >
                        <span className={`absolute top-[2px] left-[2px] bg-white rounded-full h-5 w-5 transition-all ${row.v ? "translate-x-6" : ""}`} />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-[#2a292e] rounded-lg gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#1f1f23] flex items-center justify-center">
                      <span className="material-symbols-outlined text-lg">lock</span>
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">Control Parental (PIN de 4 dígitos)</span>
                        <span className="px-2 py-0.5 rounded bg-[#0e0e12] text-[10px] text-[#ffb3b3] font-bold">Activo</span>
                      </div>
                      <span className="text-xs text-[#e7bcbc]">Clasificación máxima de títulos permitida: Adultos (18+)</span>
                    </div>
                  </div>
                  <button className="px-3 py-1.5 bg-[#1f1f23] hover:bg-[#39393d] rounded text-xs font-semibold transition-colors whitespace-nowrap">
                    Editar PIN
                  </button>
                </div>
              </section>
            </div>

            <div className="lg:col-span-5 flex flex-col gap-6">
              {/* Dispositivos */}
              <section className="flex flex-col gap-4 bg-[#1b1b1f] p-6 md:p-10 rounded-xl shadow-lg">
                <div className="flex items-center gap-3 pb-2">
                  <div className="w-9 h-9 rounded-lg bg-[#feb700]/20 flex items-center justify-center text-[#ffdb9d]">
                    <span className="material-symbols-outlined text-xl">devices</span>
                  </div>
                  <div>
                    <h3 className="text-base font-semibold">Dispositivos Vinculados</h3>
                    <p className="text-xs text-[#e7bcbc]">Sesión activa en este navegador</p>
                  </div>
                </div>
                <div className="flex flex-col gap-3">
                  {devices.map((d) => (
                    <div key={d.title} className="p-4 bg-[#1f1f23] rounded-lg flex flex-col gap-1">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-[#2a292e] flex items-center justify-center text-[#ff5262]">
                            <span className="material-symbols-outlined text-2xl">{d.icon}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-base leading-tight font-semibold">{d.title}</span>
                            <span className="text-xs text-[#e7bcbc]">{d.sub}</span>
                          </div>
                        </div>
                        {d.live && (
                          <span className="px-2 py-0.5 bg-[#2a292e] rounded text-[#ffb3b3] text-[10px] font-semibold">En uso ahora</span>
                        )}
                      </div>
                      <div className="flex items-center justify-between pt-1 text-[#e7bcbc] text-xs">
                        <span>{d.activity}</span>
                        <button
                          onClick={() => signOut({ callbackUrl: "/login" })}
                          className="text-[#ffb4ab] hover:opacity-80 text-[10px] uppercase tracking-wider font-semibold transition-opacity cursor-pointer"
                        >
                          Cerrar sesión
                        </button>
                      </div>
                    </div>
                  ))}
                  {devices.length === 0 && (
                    <p className="text-sm text-white/50">Sin dispositivos vinculados.</p>
                  )}
                </div>
                <div className="pt-1 flex items-center justify-between">
                  <span className="text-xs text-[#e7bcbc]">¿No reconoces un dispositivo?</span>
                  <Link href="/help" className="text-xs text-[#ffb3b3] hover:text-white transition-colors">Revisar seguridad</Link>
                </div>
              </section>

              {/* Almacenamiento */}
              <section className="bg-[#1b1b1f] p-6 rounded-xl flex flex-col gap-3 shadow-md">
                <div className="flex items-center justify-between">
                  <span className="text-base font-semibold">Almacenamiento de Descargas</span>
                  <span className="text-xs text-[#e7bcbc]">18.4 GB / 64 GB</span>
                </div>
                <div className="w-full h-2.5 bg-[#2a292e] rounded-full overflow-hidden flex">
                  <div className="h-full bg-[#ff5262] w-[28%]" title="Películas (14.2 GB)" />
                  <div className="h-full bg-[#c9bfff] w-[12%]" title="Series (4.2 GB)" />
                </div>
                <div className="flex items-center justify-between text-[#e7bcbc] text-xs pt-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#ff5262]" />
                    <span>Películas (3)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#c9bfff]" />
                    <span>Episodios (6)</span>
                  </div>
                  <button className="text-[#ffb3b3] hover:text-white text-[10px] uppercase tracking-wider font-bold">
                    Gestionar
                  </button>
                </div>
              </section>
            </div>
          </div>

          {/* Sesión */}
          <section className="w-full bg-[#1b1b1f] p-6 md:p-10 rounded-xl flex flex-col md:flex-row items-center justify-between gap-6 shadow-lg">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#ffb4ab]/10 flex items-center justify-center text-[#ffb4ab] flex-shrink-0">
                <span className="material-symbols-outlined text-2xl">power_settings_new</span>
              </div>
              <div className="flex flex-col">
                <h4 className="text-base font-semibold">Gestión de Sesión Activa</h4>
                <p className="text-xs text-[#e7bcbc]">Desconecta tu cuenta de forma segura en este navegador o en todos los dispositivos asociados.</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-4 w-full md:w-auto">
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="flex-1 sm:flex-none px-5 py-2.5 bg-[#1f1f23] hover:bg-[#39393d] rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">logout</span>
                Cerrar Sesión
              </button>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="flex-1 sm:flex-none px-5 py-2.5 bg-[#ff5262] hover:brightness-110 text-white rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(255,82,98,0.35)] cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">device_reset</span>
                Cerrar Sesión en todos los dispositivos
              </button>
            </div>
          </section>
        </div>
      </div>

      <BrowseFooter />
    </div>
  );
}
