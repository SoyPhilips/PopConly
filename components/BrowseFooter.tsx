import Link from "next/link";
import Logo from "./Logo";

export default function BrowseFooter() {
  return (
    <footer className="w-full bg-[#0e0e12] mt-16">
      <div className="w-full px-4 md:px-8 lg:px-14 py-10 max-w-[1800px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-10">
          <div className="lg:col-span-2 flex flex-col gap-4">
            <Logo size="sm" />
            <p className="text-sm text-[#e7bcbc] max-w-sm">
              Tu portal cinematográfico definitivo. Miles de películas y series
              originales en ultra alta definición sin límites ni
              interrupciones.
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span className="material-symbols-outlined text-[#e7bcbc] text-lg">
                language
              </span>
              <select
                aria-label="Seleccionar idioma"
                className="bg-[#1b1b1f] text-sm rounded-lg px-3 py-1.5 focus:outline-none"
              >
                <option value="es">Español (Latinoamérica)</option>
                <option value="es-es">Español (España)</option>
                <option value="en">English (US)</option>
                <option value="pt">Português (Brasil)</option>
              </select>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-bold uppercase">Navegación</h3>
            <Link href="/browse" className="text-xs text-[#e7bcbc] hover:text-white">
              Inicio
            </Link>
            <Link href="/movies" className="text-xs text-[#e7bcbc] hover:text-white">
              Películas
            </Link>
            <Link href="/series" className="text-xs text-[#e7bcbc] hover:text-white">
              Series
            </Link>
            <Link href="/categories" className="text-xs text-[#e7bcbc] hover:text-white">
              Categorías
            </Link>
            <Link href="/my-list" className="text-xs text-[#e7bcbc] hover:text-white">
              Mi Lista
            </Link>
            <Link href="/profile" className="text-xs text-[#e7bcbc] hover:text-white">
              Mi Perfil
            </Link>
          </div>
            <div className="flex flex-col gap-2">
              <h3 className="text-sm font-bold uppercase">Legal y Soporte</h3>
              <Link href="/legal" className="text-xs text-[#e7bcbc] hover:text-white">
                Términos de servicio
              </Link>
              <Link href="/legal" className="text-xs text-[#e7bcbc] hover:text-white">
                Política de privacidad
              </Link>
              <Link href="/legal" className="text-xs text-[#e7bcbc] hover:text-white">
                Preferencias de cookies
              </Link>
              <Link href="/help" className="text-xs text-[#e7bcbc] hover:text-white">
                Centro de ayuda
              </Link>
            </div>
          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-bold uppercase">Descarga la App</h3>
            <p className="text-xs text-[#e7bcbc]">
              Lleva el mejor cine en tu bolsillo en cualquier dispositivo.
            </p>
            <div className="flex flex-col gap-2 mt-1">
              <div className="flex items-center gap-3 px-4 py-2.5 bg-[#1b1b1f] rounded-lg hover:bg-[#1f1f23] transition-colors cursor-pointer">
                <span className="material-symbols-outlined text-2xl">
                  phone_iphone
                </span>
                <div className="flex flex-col">
                  <span className="text-[10px] text-[#e7bcbc] uppercase">
                    Disponible en
                  </span>
                  <span className="text-sm font-semibold">App Store</span>
                </div>
              </div>
              <div className="flex items-center gap-3 px-4 py-2.5 bg-[#1b1b1f] rounded-lg hover:bg-[#1f1f23] transition-colors cursor-pointer">
                <span className="material-symbols-outlined text-2xl">
                  smart_display
                </span>
                <div className="flex flex-col">
                  <span className="text-[10px] text-[#e7bcbc] uppercase">
                    Disponible en
                  </span>
                  <span className="text-sm font-semibold">Google Play</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[#e7bcbc]/80 text-xs">
          <span>© {new Date().getFullYear()} PopConly Inc. Todos los derechos reservados.</span>
          <div className="flex items-center gap-4">
            <span>Audio Dolby Atmos</span>
            <span>Ultra HD 4K</span>
            <span>HDR10+</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
