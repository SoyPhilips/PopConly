import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import Providers from "@/components/Providers";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
});

// Dominio canónico: del entorno en build, .com por defecto.
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://popconly.com").replace(
  /\/$/,
  ""
);

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "PopConly — Cine y series en su estado más puro",
    template: "%s | PopConly",
  },
  description:
    "PopConly es tu plataforma de streaming: películas ilimitadas, series de culto y originales exclusivos en 4K HDR y Dolby Atmos desde $4.99/mes.",
  keywords: [
    "PopConly",
    "streaming",
    "películas online",
    "series online",
    "cine 4K",
    "ver películas",
    "streaming latinoamérica",
  ],
  authors: [{ name: "PopConly" }],
  creator: "PopConly",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "PopConly — Cine y series en su estado más puro",
    description:
      "Películas ilimitadas, series de culto y originales exclusivos en 4K HDR y Dolby Atmos.",
    url: "/",
    siteName: "PopConly",
    type: "website",
    locale: "es_ES",
  },
  twitter: {
    card: "summary_large_image",
    title: "PopConly — Cine y series en su estado más puro",
    description:
      "Películas ilimitadas, series de culto y originales exclusivos en 4K HDR.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  category: "entertainment",
};

export const viewport: Viewport = {
  themeColor: "#0D0D11",
};

const JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      name: "PopConly",
      url: SITE_URL,
      description:
        "Plataforma de streaming con películas, series y originales en 4K HDR y Dolby Atmos.",
    },
    {
      "@type": "WebSite",
      name: "PopConly",
      url: SITE_URL,
      inLanguage: "es",
    },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`dark ${jakarta.variable} h-full antialiased`}>
      <head>
        <link
          rel="preload"
          href="/fonts/material-symbols-outlined.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
          fetchPriority="high"
        />
        <script
          // Muestra iconos solo con la fuente cargada (nunca los nombres).
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var d=function(ok){document.documentElement.classList.add(ok?'fonts-ready':'fonts-fallback')};if(document.fonts&&document.fonts.load){var t=setTimeout(function(){d(false)},6000);document.fonts.load('16px \"Material Symbols Outlined\"','play_arrow').then(function(){clearTimeout(t);d(true)},function(){clearTimeout(t);d(false)})}else{d(false)}}catch(e){try{document.documentElement.classList.add('fonts-fallback')}catch(_){}}})();",
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
        />
      </head>
      <body
        suppressHydrationWarning
        className="min-h-full bg-[#0D0D11] text-[#e4e1e7] flex flex-col"
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
