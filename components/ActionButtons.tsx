"use client";

import { useState } from "react";

export function LikeButton({
  title = "Me gusta",
  className = "w-12 h-12",
  outline = false,
}: {
  title?: string;
  className?: string;
  outline?: boolean;
}) {
  const [on, setOn] = useState(false);
  const [popKey, setPopKey] = useState(0);

  return (
    <button
      onClick={() => {
        setOn((v) => !v);
        setPopKey((k) => k + 1);
      }}
      title={title}
      aria-pressed={on}
      className={`flex items-center justify-center rounded-full backdrop-blur-md transition-all hover:scale-110 active:scale-90 shadow-md cursor-pointer ${className} ${
        outline
          ? "bg-transparent border-2 border-white/40 hover:border-white"
          : "bg-[#2a292e]/70 hover:bg-[#353439]"
      }`}
    >
      <span
        key={popKey}
        className={`material-symbols-outlined text-2xl transition-colors ${popKey > 0 ? "like-pop" : ""} text-[#e7bcbc]`}
        style={on ? { fontVariationSettings: "'FILL' 1" } : undefined}
      >
        thumb_up
      </span>
    </button>
  );
}

export function PlusCheckButton({
  title = "Añadir a Mi Lista",
  className = "w-12 h-12",
  outline = false,
  initialOn = false,
  onToggle,
}: {
  title?: string;
  className?: string;
  outline?: boolean;
  initialOn?: boolean;
  onToggle?: (on: boolean) => void;
}) {
  const [on, setOn] = useState(initialOn);

  return (
    <button
      onClick={() => {
        const next = !on;
        setOn(next);
        onToggle?.(next);
      }}
      data-on={on}
      title={on ? "En tu lista" : title}
      aria-pressed={on}
      className={`morph-btn flex items-center justify-center rounded-full backdrop-blur-md transition-all hover:scale-110 active:scale-90 shadow-md ${className} ${
        outline
          ? "bg-transparent border-2 border-white/40 hover:border-white"
          : "bg-[#2a292e]/70 hover:bg-[#353439]"
      }`}
    >
      <svg viewBox="0 0 24 24" className="w-6 h-6" aria-hidden="true">
        <g
          className="morph-plus"
          stroke="white"
          strokeWidth={2.4}
          strokeLinecap="round"
        >
          <path d="M12 5v14" />
          <path d="M5 12h14" />
        </g>
        <path className="morph-tick" d="M5 13l5 5L20 7" pathLength={100} />
      </svg>
    </button>
  );
}
