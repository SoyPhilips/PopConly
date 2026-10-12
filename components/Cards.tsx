"use client";

import type { CatalogItem } from "@/lib/catalog";

type CardProps = {
  item: CatalogItem;
  onSelect: (item: CatalogItem) => void;
};

export function PosterCard({ item, onSelect }: CardProps) {
  return (
    <button
      onClick={() => onSelect(item)}
      className="group relative rounded-xl bg-[#1b1b1f] overflow-hidden shadow-md hover:shadow-2xl hover:shadow-[#ff5262]/20 transition-all duration-300 hover:-translate-y-1 hover:scale-[1.04] flex flex-col text-left cursor-pointer"
    >
      <span className="relative w-full aspect-[2/3] overflow-hidden bg-[#0e0e12] block">
        <img
          src={item.image}
          alt={item.title}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.06]"
        />
        <span className="absolute inset-0 bg-gradient-to-t from-[#0e0e12] via-transparent to-transparent opacity-90 pointer-events-none" />
        {item.rating && (
          <span className="absolute top-2.5 right-2.5 px-1.5 py-0.5 rounded bg-black/80 backdrop-blur-md text-[10px] font-bold flex items-center gap-1">
            <span
              className="material-symbols-outlined text-[11px] text-[#ffba20]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              star
            </span>
            {item.rating}
          </span>
        )}
        {item.match && (
          <span className="absolute bottom-2 left-2.5 px-1.5 py-0.5 rounded bg-[#feb700]/20 text-[#ffba20] text-[10px] font-bold">
            {item.match}
          </span>
        )}
      </span>
      <span className="p-3 flex-1 flex flex-col justify-between block">
        <span className="block">
          <span className="block text-base font-semibold truncate group-hover:text-[#ffb3b3] transition-colors">
            {item.title}
          </span>
          <span className="block text-xs text-[#e7bcbc]/80 truncate mt-0.5">
            {(item.genres ?? []).join(" • ")}
          </span>
        </span>
        <span className="block text-[10px] text-[#e7bcbc]/60 mt-2">
          {item.meta ?? `${item.year ?? ""} • ${item.type ?? ""}`}
        </span>
      </span>
    </button>
  );
}

export function BackdropCard({ item, onSelect }: CardProps) {
  return (
    <button
      onClick={() => onSelect(item)}
      className="group relative flex flex-col bg-[#1b1b1f] rounded-xl overflow-hidden shadow-lg transition-all duration-300 hover:scale-[1.04] text-left cursor-pointer"
    >
      <span className="relative w-full aspect-video overflow-hidden block">
        <img
          src={item.image}
          alt={item.title}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.06]"
        />
        <span className="absolute inset-0 bg-gradient-to-t from-[#0D0D11] via-transparent to-transparent opacity-80 pointer-events-none" />
        {item.rating && (
          <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded bg-black/80 text-[10px] font-bold">
            ★ {item.rating}
          </span>
        )}
        {typeof item.progress === "number" && item.progress > 0 && (
          <span className="absolute bottom-0 left-0 right-0 h-1 bg-[#353439] block">
            <span
              className="h-full bg-[#ff5262] block"
              style={{ width: `${item.progress}%` }}
            />
          </span>
        )}
      </span>
      <span className="p-3 flex flex-col gap-1 block">
        <span className="text-base font-semibold truncate block">
          {item.title}
        </span>
        <span className="text-xs text-[#e7bcbc] line-clamp-1 block">
          {item.synopsis}
        </span>
      </span>
    </button>
  );
}

export function CatalogRow({
  title,
  subtitle,
  items,
  onSelect,
  variant = "poster",
}: {
  title: string;
  subtitle?: string;
  items: CatalogItem[];
  onSelect: (item: CatalogItem) => void;
  variant?: "poster" | "backdrop";
}) {
  if (items.length === 0) return null;
  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
        {subtitle && (
          <p className="text-xs text-[#e7bcbc] mt-0.5">{subtitle}</p>
        )}
      </div>
      <div
        className={
          variant === "poster"
            ? "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4"
            : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        }
      >
        {items.map((item) =>
          variant === "poster" ? (
            <PosterCard key={item.title} item={item} onSelect={onSelect} />
          ) : (
            <BackdropCard key={item.title} item={item} onSelect={onSelect} />
          )
        )}
      </div>
    </section>
  );
}
