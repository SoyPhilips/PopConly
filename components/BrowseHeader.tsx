"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import Logo from "./Logo";
import ProfileAvatar from "./ProfileAvatar";
import { getActiveProfile } from "@/lib/activeProfile";
import { thumb } from "@/lib/thumb";
import { useLang } from "@/lib/i18n";

type Props = {
  query: string;
  onQueryChange: (q: string) => void;
};

type Notif = {
  id: string;
  kind: string;
  title: string;
  body: string;
  slug: string;
  image: string;
  at: number;
  read: boolean;
};

function timeAgo(at: number): string {
  const s = Math.max(0, Math.floor((Date.now() - at) / 1000));
  if (s < 60) return "Ahora mismo";
  const m = Math.floor(s / 60);
  if (m < 60) return `Hace ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `Hace ${h} h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `Hace ${d} d`;
  return new Date(at).toLocaleDateString("es-CO", { day: "numeric", month: "short" });
}

const NAV: { href: string; label: "nav_home" | "nav_movies" | "nav_series" | "nav_categories" | "nav_mylist" }[] = [
  { href: "/browse", label: "nav_home" },
  { href: "/movies", label: "nav_movies" },
  { href: "/series", label: "nav_series" },
  { href: "/categories", label: "nav_categories" },
  { href: "/my-list", label: "nav_mylist" },
];

export default function BrowseHeader({ query, onQueryChange }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  const { t } = useLang();
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [notifsDone, setNotifsDone] = useState(false);
  const hasUnread = notifs.some((n) => !n.read);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  // Notificaciones reales del perfil (DB + algoritmo). Sin sesión no hay campana.
  useEffect(() => {
    if (status !== "authenticated") {
      setNotifs([]);
      setNotifsDone(true);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch(
          `/api/notifications?profile=${encodeURIComponent(getActiveProfile())}`
        );
        if (!r.ok) return;
        const d = (await r.json()) as { items?: Notif[] };
        if (!cancelled && Array.isArray(d.items)) setNotifs(d.items);
      } catch {
        /* sin notificaciones */
      } finally {
        if (!cancelled) setNotifsDone(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [status]);

  // Estilo plataformas grandes: una notificación queda NO LEÍDA (punto rojo)
  // hasta que se hace clic en ELLA. Abrir la campana no borra nada.
  // keepalive: el clic navega de inmediato y el navegador cancelaría el
  // POST normal; así la lectura sí queda guardada en el servidor.
  const markRead = async (id: string) => {
    setNotifs((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    try {
      await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        keepalive: true,
        body: JSON.stringify({ profile: getActiveProfile(), action: "read", id }),
      });
    } catch {
      /* mejor esfuerzo */
    }
  };

  // Descartar con la X: se quita al instante y jamás vuelve (por usuario+perfil).
  const dismissNotif = async (id: string) => {
    setNotifs((prev) => prev.filter((n) => n.id !== id));
    try {
      await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        keepalive: true,
        body: JSON.stringify({ profile: getActiveProfile(), action: "dismiss", id }),
      });
    } catch {
      /* mejor esfuerzo */
    }
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (searchOpen) inputRef.current?.focus();
  }, [searchOpen]);

  // Colapsar al tocar fuera o pulsar Escape (Escape además LIMPIA la búsqueda
  // para volver a la pestaña tal como estaba).
  useEffect(() => {
    if (!searchOpen) return;
    const onDown = (e: MouseEvent | TouchEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onQueryChange("");
        setSearchOpen(false);
        (document.activeElement as HTMLElement | null)?.blur?.();
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [searchOpen, onQueryChange]);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 border-b transition-colors duration-300 ${
        scrolled ? "border-white/10" : "border-transparent"
      }`}
    >
      {/* Capa base: degradado sobre el hero */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 to-transparent pointer-events-none" />
      {/* Blur siempre activo + fondo que se intensifica al hacer scroll */}
      <div
        className={`absolute inset-0 backdrop-blur-xl transition-colors duration-300 pointer-events-none ${
          scrolled ? "bg-[#0D0D11]/90" : "bg-[#0D0D11]/0"
        }`}
      />
      <div
        className={`absolute inset-x-0 bottom-0 h-px bg-white/10 transition-opacity duration-300 pointer-events-none ${
          scrolled ? "opacity-100" : "opacity-0"
        }`}
      />
      <div className="relative max-w-[1800px] mx-auto px-4 md:px-8 lg:px-14 py-3 flex items-center gap-4 md:gap-6">
        <Link href="/browse" className="shrink-0" aria-label="PopConly inicio">
          <Logo size="sm" />
        </Link>

        <nav className="hidden lg:flex items-center gap-7 text-[15px] text-white/80 ml-2">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={
                pathname === n.href
                  ? "text-white font-semibold"
                  : "hover:text-white transition-colors"
              }
            >
              {t(n.label)}
            </Link>
          ))}
        </nav>

        {/* Nav móvil */}
        <nav className="flex lg:hidden items-center gap-4 text-[13px] text-white/80 ml-1 overflow-x-auto">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={
                pathname === n.href
                  ? "text-white font-semibold whitespace-nowrap"
                  : "hover:text-white whitespace-nowrap"
              }
            >
              {t(n.label)}
            </Link>
          ))}
        </nav>

        <div className="flex-1" />

        {/* Buscador expandible */}
        <div className="flex items-center">
          <div
            ref={searchRef}
            className={`flex items-center rounded-xl border overflow-hidden transition-all duration-300 ease-out ${
              searchOpen
                ? "w-[200px] sm:w-[300px] lg:w-[340px] opacity-100 bg-[#1b1b1f] border-white/10"
                : "w-10 opacity-100 bg-transparent border-transparent"
            }`}
          >
            <button
              aria-label={t("hdr_searchAria")}
              onClick={() => {
                if (!searchOpen) setSearchOpen(true);
                else if (!query) setSearchOpen(false);
                else inputRef.current?.focus();
              }}
              className="w-10 h-10 shrink-0 flex items-center justify-center text-white/80 hover:text-white cursor-pointer"
            >
              <span className="material-symbols-outlined text-[22px]">
                search
              </span>
            </button>
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && query.trim()) {
                  setNotifOpen(false);
                  setAvatarOpen(false);
                  router.push(`/search?q=${encodeURIComponent(query.trim())}`);
                }
              }}
              placeholder={t("hdr_searchPh")}
              className={`bg-transparent text-sm placeholder:text-white/40 focus:outline-none transition-all duration-300 ${
                searchOpen ? "w-full pr-3 py-2.5 opacity-100" : "w-0 p-0 opacity-0"
              }`}
            />
            {searchOpen && query && (
            <button
              aria-label={t("hdr_clearSearch")}
              onClick={() => onQueryChange("")}
                className="pr-2 text-white/50 hover:text-white cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">
                  close
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Notificaciones (solo con sesión) */}
        {status === "authenticated" && (
        <div className="relative">
          <button
            aria-label={t("hdr_notifs")}
            onClick={() => {
              setNotifOpen(!notifOpen);
              setAvatarOpen(false);
            }}
            className="w-10 h-10 rounded-full bg-[#1b1b1f] border border-white/10 hover:bg-[#2a292e] flex items-center justify-center transition-colors relative"
          >
            <span className="material-symbols-outlined text-[22px]">
              notifications
            </span>
            {hasUnread && (
              <span className="absolute top-[7px] right-[8px] w-2.5 h-2.5 rounded-full bg-[#e50914] border-2 border-[#0D0D11]" />
            )}
          </button>
          {notifOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setNotifOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-[340px] rounded-xl bg-[#1b1b1f] border border-white/10 shadow-2xl z-50 overflow-hidden">
                <p className="px-4 py-3 text-sm font-bold border-b border-white/10">
                  {t("hdr_notifs")}
                </p>
                {!notifsDone ? (
                  <div className="flex flex-col gap-3 p-4">
                    {[0, 1, 2].map((i) => (
                      <div key={i} className="flex gap-3 animate-pulse">
                        <div className="w-14 h-14 rounded-lg bg-[#2a292e] shrink-0" />
                        <div className="flex-1 flex flex-col gap-2 py-1">
                          <div className="h-3 w-3/4 rounded bg-[#2a292e]" />
                          <div className="h-3 w-full rounded bg-[#2a292e]" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : notifs.length === 0 ? (
                  <p className="px-4 py-6 text-xs text-white/50 text-center">
                    {t("hdr_notifsEmpty")}
                  </p>
                ) : (
                <div className="max-h-[60vh] overflow-y-auto">
                {notifs.map((n) => (
                  <div key={n.id} className="relative group">
                  <Link
                    href={`/watch?title=${encodeURIComponent(n.title.replace(/^(Nuevo trailer:\s*|Porque viste [^:]+:\s*)/, ""))}`}
                    onClick={() => {
                      void markRead(n.id);
                      setNotifOpen(false);
                    }}
                    className="flex gap-3 pl-4 pr-9 py-3 hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    <img
                      src={thumb(n.image, 256)}
                      alt=""
                      loading="lazy"
                      className="w-14 h-14 rounded-lg object-cover shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold leading-snug flex items-center gap-1.5">
                        {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-[#e50914] shrink-0" />}
                        <span className="truncate">{n.title}</span>
                      </p>
                      <p className="text-xs text-white/60 truncate">{n.body}</p>
                      <p className="text-[11px] text-white/40 mt-1">{timeAgo(n.at)}</p>
                    </div>
                  </Link>
                  <button
                    aria-label="Descartar notificación"
                    title="Descartar"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      void dismissNotif(n.id);
                    }}
                    className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 hover:bg-[#e50914] text-white/70 hover:text-white flex items-center justify-center transition-all md:opacity-0 md:group-hover:opacity-100 focus-visible:opacity-100 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[14px]">close</span>
                  </button>
                  </div>
                ))}
                </div>
                )}
              </div>
            </>
          )}
        </div>
        )}

        {/* Avatar */}
        <div className="relative">
          <button
            onClick={() => {
              setAvatarOpen((v) => !v);
              setNotifOpen(false);
            }}
            aria-label={t("hdr_profileAria")}
          >
            <ProfileAvatar className="w-10 h-10 text-lg border border-white/20 hover:border-white/60 transition-colors" />
          </button>
          {avatarOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setAvatarOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-52 rounded-xl bg-[#1b1b1f] border border-white/10 shadow-2xl z-50 py-2 text-sm">
                {session?.user?.email && (
                  <p className="px-4 py-2 text-xs text-white/50 truncate border-b border-white/10">
                    {session.user.email}
                  </p>
                )}
                <Link
                  href="/profile"
                  className="block px-4 py-2 hover:bg-white/5"
                  onClick={() => setAvatarOpen(false)}
                >
                  {t("nav_profile")}
                </Link>
                <Link
                  href="/my-list"
                  className="block px-4 py-2 hover:bg-white/5"
                  onClick={() => setAvatarOpen(false)}
                >
                  {t("nav_mylist")}
                </Link>
                <button
                  onClick={() => {
                    setAvatarOpen(false);
                    signOut({ callbackUrl: "/login" });
                  }}
                  className="block w-full text-left px-4 py-2 hover:bg-white/5 text-white/70 cursor-pointer"
                >
                  {t("nav_signout")}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
