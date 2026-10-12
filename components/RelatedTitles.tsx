"use client";

import { useRouter } from "next/navigation";
import { PosterMiniCard } from "./PrototypeCards";
import type { TitleDoc } from "@/lib/catalogDb";

export default function RelatedTitles({ items }: { items: TitleDoc[] }) {
  const router = useRouter();
  if (items.length === 0) return null;
  return (
    <div className="px-4 md:px-8 lg:px-14 pb-16 max-w-[1800px] mx-auto">
      <h2 className="text-xl font-bold mb-4">Más como esto</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {items.map((r) => (
          <PosterMiniCard
            key={r.slug}
            item={r}
            onSelect={() => router.push(`/titulo/${r.slug}`)}
          />
        ))}
      </div>
    </div>
  );
}
