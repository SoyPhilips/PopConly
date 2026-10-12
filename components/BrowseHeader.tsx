"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import Logo from "./Logo";
import ProfileAvatar from "./ProfileAvatar";

type Props = {
  query: string;
  onQueryChange: (q: string) => void;
};

const NAV = [
  { href: "/browse", label: "Inicio" },
  { href: "/movies", label: "Películas" },
  { href: "/series", label: "Series" },
  { href: "/categories", label: "Categorías" },
  { href: "/my-list", label: "Mi Lista" },
];

const NOTIFS = [
  {
    title: "Nuevo episodio de Fallout",
    q: "Fallout",
    desc: "T2:E1 ya disponible en 4K Dolby Vision.",
    time: "Hace 2 h",
    img: "/api/stream?file=series/accion/fallout/horizontal.jpg",
  },
  {
    title: "Top 1 hoy: Deadpool & Wolverine",
    q: "Deadpool & Wolverine",
    desc: "La película más vista en tu país.",
    time: "Hace 6 h",
    img: "/api/stream?file=peliculas/accion/deadpool-wolverine/horizontal.jpg",
  },
  {
    title: "Recién llegado: Ballerina",
    q: "Ballerina",
    desc: "Acción original en 4K HDR.",
    time: "Ayer",
    img: "/api/stream?file=peliculas/accion/ballerina/horizontal.jpg",
  },
];

export default function BrowseHeader({ query, onQueryChange }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (searchOpen) inputRef.current?.focus();
  }, [searchOpen]);

  // Colapsar al tocar fuera o pulsar Escape
  useEffect(() => {
    if (!searchOpen) return;
    const onDown = (e: MouseEvent | TouchEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSearchOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [searchOpen]);

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
              {n.label}
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
              {n.label}
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
              aria-label="Buscar"
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
              placeholder="Títulos, géneros, personas..."
              className={`bg-transparent text-sm placeholder:text-white/40 focus:outline-none transition-all duration-300 ${
                searchOpen ? "w-full pr-3 py-2.5 opacity-100" : "w-0 p-0 opacity-0"
              }`}
            />
            {searchOpen && query && (
              <button
                aria-label="Limpiar búsqueda"
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

        {/* Notificaciones */}
        <div className="relative">
          <button
            aria-label="Notificaciones"
            onClick={() => {
              setNotifOpen((v) => !v);
              setAvatarOpen(false);
              setHasUnread(false);
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
                  Notificaciones
                </p>
                {NOTIFS.map((n) => (
                  <Link
                    key={n.title}
                    href={`/search?q=${encodeURIComponent(n.q ?? n.title.split(":")[0])}`}
                    onClick={() => setNotifOpen(false)}
                    className="flex gap-3 px-4 py-3 hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    <img
                      src={n.img}
                      alt=""
                      className="w-14 h-14 rounded-lg object-cover shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold leading-snug">
                        {n.title}
                      </p>
                      <p className="text-xs text-white/60 truncate">{n.desc}</p>
                      <p className="text-[11px] text-white/40 mt-1">{n.time}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Avatar */}
        <div className="relative">
          <button
            onClick={() => {
              setAvatarOpen((v) => !v);
              setNotifOpen(false);
            }}
            aria-label="Mi Perfil"
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
                  Mi perfil
                </Link>
                <Link
                  href="/my-list"
                  className="block px-4 py-2 hover:bg-white/5"
                  onClick={() => setAvatarOpen(false)}
                >
                  Mi lista
                </Link>
                <button
                  onClick={() => {
                    setAvatarOpen(false);
                    signOut({ callbackUrl: "/login" });
                  }}
                  className="block w-full text-left px-4 py-2 hover:bg-white/5 text-white/70 cursor-pointer"
                >
                  Cerrar sesión
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
