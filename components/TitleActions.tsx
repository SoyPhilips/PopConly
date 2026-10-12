"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { loadMyList, saveMyList, toggleMyList } from "@/lib/myListStore";
import type { TitleDoc } from "@/lib/catalogDb";
import { LikeButton, PlusCheckButton } from "./ActionButtons";

export default function TitleActions({ doc }: { doc: TitleDoc }) {
  const [inList, setInList] = useState(false);

  useEffect(() => {
    setInList(loadMyList().some((i) => i.title === doc.title));
  }, [doc.title]);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Link
        href={`/watch?title=${encodeURIComponent(doc.title)}`}
        className="flex items-center gap-2 px-7 py-3 rounded-xl bg-[#e50914] hover:bg-[#f6121d] font-bold transition-colors cursor-pointer"
      >
        <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
          play_arrow
        </span>
        Reproducir
      </Link>
      <PlusCheckButton
        key={`t-${doc.title}-${inList}`}
        initialOn={inList}
        onToggle={() => {
          const next = toggleMyList(doc, loadMyList());
          saveMyList(next);
          setInList(next.some((i) => i.title === doc.title));
        }}
      />
      <LikeButton />
    </div>
  );
}
