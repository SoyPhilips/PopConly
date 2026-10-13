"use client";

import { useState } from "react";

/** Carátula con esqueleto: gris pulsante hasta que la imagen real carga,
 *  luego fundido suave. Reintenta 3 veces (los picos de miniaturas a veces
 *  tumban alguna suelta); solo entonces muestra icono neutro.
 *  Si el navegador ya la tiene completa (recarga con caché), onLoad puede
 *  haberse disparado antes de hidratar: se detecta por ref para no quedar
 *  invisible para siempre. */
export default function CoverImg({
  src,
  alt,
  className = "",
  wrapperClassName = "",
  loading = "lazy",
}: {
  src: string | undefined;
  alt: string;
  className?: string;
  wrapperClassName?: string;
  loading?: "lazy" | "eager";
}) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  if (!src) return <span className={`block bg-[#2a292e] ${wrapperClassName}`} aria-label={alt} />;
  return (
    <span className={`block relative w-full h-full bg-[#2a292e] overflow-hidden ${wrapperClassName}`}>
      {!loaded && !failed && <span className="absolute inset-0 animate-pulse bg-[#2a292e]" />}
      {!failed ? (
        <img
          key={attempt}
          ref={(el) => {
            // Imagen ya completa desde caché: marcar cargada de inmediato.
            if (el && el.complete && el.naturalWidth > 0) setLoaded(true);
          }}
          src={src}
          alt={alt}
          loading={loading}
          decoding="async"
          draggable={false}
          onLoad={() => setLoaded(true)}
          onError={() => {
            // Reintento con espera creciente; picos de CPU tumban sueltas.
            if (attempt < 2) {
              const n = attempt + 1;
              setTimeout(() => setAttempt(n), 800 * n);
            } else {
              setFailed(true);
            }
          }}
          className={`${className} transition-opacity duration-500 ${loaded ? "opacity-100" : "opacity-0"}`}
        />
      ) : (
        <span className="absolute inset-0 flex items-center justify-center text-white/20">
          <span className="material-symbols-outlined text-4xl">broken_image</span>
        </span>
      )}
    </span>
  );
}
