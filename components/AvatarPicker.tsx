"use client";

import { useState } from "react";
import AvatarFace from "./AvatarFace";
import { thumb } from "@/lib/thumb";

/** Personajes reales del catálogo sobre fondo sólido (estilo Netflix).
 *  Se guarda la foto elegida (o la inicial) en la DB del perfil. */

export type AvatarChoice = { id: string; label: string; src: string | null };

const V = (kind: string, cat: string, slug: string) =>
  `/api/stream?file=${kind}/${cat}/${slug}/vertical.jpg&w=256`;

export const AVATAR_CHOICES: AvatarChoice[] = [
  { id: "initial", label: "Inicial", src: null },
  { id: "deadpool", label: "Deadpool", src: V("peliculas", "accion", "deadpool-wolverine") },
  { id: "spidey", label: "Spider-Man", src: V("peliculas", "accion", "spider-man-brand-new-day") },
  { id: "toystory", label: "Toy Story", src: V("peliculas", "comedia", "toy-story-5") },
  { id: "minecraft", label: "Minecraft", src: V("peliculas", "comedia", "a-minecraft-movie") },
  { id: "gladiator", label: "Gladiator II", src: V("peliculas", "accion", "gladiator-ii") },
  { id: "ballerina", label: "Ballerina", src: V("peliculas", "accion", "ballerina") },
  { id: "avatar", label: "Avatar", src: V("peliculas", "ciencia-ficcion", "avatar-fire-and-ash") },
  { id: "f1", label: "F1", src: V("peliculas", "accion", "f1") },
  { id: "fallout", label: "Fallout", src: V("series", "accion", "fallout") },
  { id: "cobra", label: "Cobra Kai", src: V("series", "accion", "cobra-kai") },
  { id: "genv", label: "Gen V", src: V("series", "accion", "gen-v") },
  { id: "3bp", label: "3 Body Problem", src: V("series", "ciencia-ficcion", "3-body-problem") },
];

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
          Personajes de tu catálogo sobre fondo sólido, o la inicial de {name}.
        </p>
        <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
          {AVATAR_CHOICES.map((c) => {
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
