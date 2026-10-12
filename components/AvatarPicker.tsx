"use client";

import { useState } from "react";
import AvatarFace from "./AvatarFace";
import { CUSTOM_AVATARS, type CustomAvatar } from "@/lib/avatars";

/** Galería de avatares: la inicial + personajes generados por el equipo
 *  (public/avatars + lib/avatars.ts). Sin carátulas de muestra. */

export type AvatarChoice = { id: string; label: string; src: string | null };

const INITIAL_CHOICE: AvatarChoice = { id: "initial", label: "Inicial", src: null };

function toChoices(custom: CustomAvatar[]): AvatarChoice[] {
  return [
    INITIAL_CHOICE,
    ...custom.map((c) => ({ id: c.id, label: c.label, src: c.src as string | null })),
  ];
}

export default function AvatarPicker({
  name,
  current,
  saving,
  onPick,
  onClose,
}: {
  name: string;
  current: string | null;
  saving: boolean;
  onPick: (src: string | null) => void;
  onClose: () => void;
}) {
  const [sel, setSel] = useState<string | null>(current);
  const choices = toChoices(CUSTOM_AVATARS);
  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-label="Elegir avatar"
    >
      <div
        className="w-full max-w-lg rounded-2xl bg-[#1b1b1f] border border-white/10 p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-lg font-bold">Elige tu avatar</h3>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center cursor-pointer"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <p className="text-xs text-[#e7bcbc] mb-5">
          {choices.length > 1
            ? `Personajes de tu catálogo sobre fondo sólido, o la inicial de ${name}.`
            : "De momento, la inicial de tu perfil. Tus personajes generados aparecerán aquí."}
        </p>
        <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
          {choices.map((c) => {
            const active = (sel ?? null) === c.src;
            return (
              <button
                key={c.id}
                title={c.label}
                onClick={() => setSel(c.src)}
                className={`relative aspect-square rounded-2xl overflow-hidden cursor-pointer transition-all ${
                  active
                    ? "ring-2 ring-[#ff5262] scale-105 shadow-[0_0_18px_rgba(255,82,98,0.45)]"
                    : "ring-1 ring-white/10 hover:ring-white/40"
                }`}
              >
                <span className="absolute inset-0 bg-gradient-to-br from-[#353439] to-[#1b1b1f]" />
                {c.src ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={c.src}
                    alt={c.label}
                    loading="lazy"
                    className="absolute inset-0 w-full h-full object-cover object-top"
                  />
                ) : (
                  <span className="absolute inset-0 flex items-center justify-center">
                    <AvatarFace name={name} avatar={null} className="w-12 h-12 text-xl" rounded="rounded-2xl" />
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <button
          onClick={() => onPick(sel ?? null)}
          disabled={saving}
          className="mt-6 w-full py-3 rounded-xl bg-[#ff5262] hover:brightness-110 disabled:opacity-50 font-semibold text-sm cursor-pointer"
        >
          {saving ? "Guardando…" : "Guardar avatar"}
        </button>
      </div>
    </div>
  );
}
