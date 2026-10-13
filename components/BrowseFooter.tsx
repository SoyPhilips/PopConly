"use client";

import Link from "next/link";
import Logo from "./Logo";
import { useLang, type Lang } from "@/lib/i18n";

export default function BrowseFooter() {
  const { lang, setLang, t } = useLang();
  return (
    <footer className="w-full bg-[#0e0e12] mt-16">
      <div className="w-full px-4 md:px-8 lg:px-14 py-10 max-w-[1800px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-10">
          <div className="lg:col-span-2 flex flex-col gap-4">
            <Logo size="sm" />
            <p className="text-sm text-[#e7bcbc] max-w-sm">
              {t("ft_tagline")}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span className="material-symbols-outlined text-[#e7bcbc] text-lg">
                language
              </span>
              <select
                aria-label={t("ft_langLabel")}
                value={lang}
                onChange={(e) => setLang(e.target.value as Lang)}
                className="bg-[#1b1b1f] text-sm rounded-lg px-3 py-1.5 focus:outline-none cursor-pointer"
              >
                <option value="es">Español</option>
                <option value="en">English</option>
              </select>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-bold uppercase">{t("ft_nav")}</h3>
            <Link href="/browse" className="text-xs text-[#e7bcbc] hover:text-white">
              {t("nav_home")}
            </Link>
            <Link href="/movies" className="text-xs text-[#e7bcbc] hover:text-white">
              {t("nav_movies")}
            </Link>
            <Link href="/series" className="text-xs text-[#e7bcbc] hover:text-white">
              {t("nav_series")}
            </Link>
            <Link href="/categories" className="text-xs text-[#e7bcbc] hover:text-white">
              {t("nav_categories")}
            </Link>
            <Link href="/my-list" className="text-xs text-[#e7bcbc] hover:text-white">
              {t("nav_mylist")}
            </Link>
            <Link href="/profile" className="text-xs text-[#e7bcbc] hover:text-white">
              {t("nav_profile")}
            </Link>
          </div>
            <div className="flex flex-col gap-2">
              <h3 className="text-sm font-bold uppercase">{t("ft_legal")}</h3>
              <Link href="/legal" className="text-xs text-[#e7bcbc] hover:text-white">
                {t("ft_terms")}
              </Link>
              <Link href="/legal" className="text-xs text-[#e7bcbc] hover:text-white">
                {t("ft_privacy")}
              </Link>
              <Link href="/legal" className="text-xs text-[#e7bcbc] hover:text-white">
                {t("ft_cookies")}
              </Link>
              <Link href="/help" className="text-xs text-[#e7bcbc] hover:text-white">
                {t("ft_help")}
              </Link>
            </div>
          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-bold uppercase">{t("ft_app")}</h3>
            <p className="text-xs text-[#e7bcbc]">
              {t("ft_appSub")}
            </p>
            <div className="flex flex-col gap-2 mt-1">
              <div className="flex items-center gap-3 px-4 py-2.5 bg-[#1b1b1f] rounded-lg hover:bg-[#1f1f23] transition-colors cursor-pointer">
                <span className="material-symbols-outlined text-2xl">
                  phone_iphone
                </span>
                <div className="flex flex-col">
                  <span className="text-[10px] text-[#e7bcbc] uppercase">
                    {t("ft_avail")}
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
                    {t("ft_avail")}
                  </span>
                  <span className="text-sm font-semibold">Google Play</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[#e7bcbc]/80 text-xs">
          <span>© {new Date().getFullYear()} {t("ft_rights")}</span>
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
