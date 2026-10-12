"use client";

/** Rostro de perfil: foto elegida o inicial del nombre (estilo Netflix).
 *  Nunca muestra la imagen de prueba. */

const PALETTE = [
  "from-[#ff5262] to-[#a32433]",
  "from-[#917eff] to-[#4a3aa8]",
  "from-[#feb700] to-[#9a6200]",
  "from-[#3ec6b8] to-[#1c6e66]",
  "from-[#5aa9ff] to-[#274b8f]",
  "from-[#ff7ab8] to-[#8f2d5a]",
];

export function avatarColor(name: string): string {
  let h = 0;
  const s = (name || "?").toLowerCase();
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

export function avatarInitial(name: string): string {
  const clean = (name || "?").trim();
  return (clean.charAt(0) || "?").toUpperCase();
}

export default function AvatarFace({
  name,
  avatar,
  className = "w-10 h-10 text-lg",
  rounded = "rounded-full",
}: {
  name: string;
  avatar?: string | null;
  className?: string;
  rounded?: string;
}) {
  if (avatar) {
    return (
      <img
        alt={`Avatar de ${name}`}
        src={avatar}
        className={`${className} ${rounded} object-cover`}
        loading="lazy"
      />
    );
  }
  return (
    <span
      aria-label={`Avatar de ${name}`}
      className={`${className} ${rounded} bg-gradient-to-br ${avatarColor(name)} flex items-center justify-center font-extrabold text-white select-none shrink-0`}
    >
      {avatarInitial(name)}
    </span>
  );
}
