import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import BrowseFooter from "@/components/BrowseFooter";
import TitleActions from "@/components/TitleActions";
import RelatedTitles from "@/components/RelatedTitles";
import { getAllSlugs, getRelated, getTitleBySlug } from "@/lib/catalogDb";
import { thumb } from "@/lib/thumb";

// Títulos nuevos en Mongo aparecen sin reconstruir (revalida cada hora).
export const revalidate = 3600;
export const dynamicParams = true;

export async function generateStaticParams() {
  // Solo las primeras 24 en build; el resto bajo demanda (dynamicParams).
  const slugs = await getAllSlugs();
  return slugs.slice(0, 24).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const doc = await getTitleBySlug(slug);
  if (!doc) return { title: "Título no encontrado" };
  const desc = doc.synopsis ?? `${doc.title} en PopConly.`;
  return {
    title: doc.title,
    description: desc,
    alternates: { canonical: `/titulo/${doc.slug}` },
    openGraph: {
      title: `${doc.title} | PopConly`,
      description: desc,
      url: `/titulo/${doc.slug}`,
      type: "video.other",
      images: [{ url: doc.image }],
    },
  };
}

const JSON_LD = (doc: Awaited<ReturnType<typeof getTitleBySlug>>) => ({
  "@context": "https://schema.org",
  "@type": doc?.type === "Película" ? "Movie" : "TVSeries",
  name: doc?.title,
  description: doc?.synopsis,
  image: doc?.image,
  datePublished: doc?.year,
  contentRating: doc?.age,
  genre: doc?.genres,
});

export default async function TitlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const doc = await getTitleBySlug(slug);
  if (!doc) notFound();
  const related = await getRelated(doc);

  return (
    <div className="w-full min-h-screen bg-[#0D0D11] text-[#e4e1e7]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD(doc)) }}
      />
      {/* Solo header visual aquí: la página es pública para SEO */}
      <div className="relative w-full min-h-[70vh] flex items-end overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url('${thumb(doc.image, 1280)}')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0D0D11] via-[#0D0D11]/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0D0D11] via-[#0D0D11]/70 to-transparent" />
        <div className="relative z-10 w-full px-4 md:px-8 lg:px-14 pb-12 pt-28 max-w-[1800px] mx-auto">
          <Link
            href="/browse"
            className="inline-flex items-center gap-1 text-xs text-white/60 hover:text-white mb-6"
          >
            <span className="material-symbols-outlined text-base">arrow_back</span>
            Volver al catálogo
          </Link>
          <h1 className="text-4xl md:text-6xl font-extrabold uppercase tracking-tight max-w-4xl">
            {doc.title}
          </h1>
          <div className="flex flex-wrap items-center gap-2 mt-4 text-xs font-semibold">
            {doc.match && (
              <span className="text-[#7ee2a8] font-bold">{doc.match}</span>
            )}
            <span>{doc.year}</span>
            <span className="px-1.5 border border-white/40 text-[10px]">{doc.age}</span>
            <span className="text-white/60">{doc.meta ?? doc.type}</span>
            {doc.rating && <span className="text-[#ffba20] font-bold">★ {doc.rating}</span>}
          </div>
          <p className="mt-4 max-w-2xl text-[15px] text-white/85 leading-relaxed">
            {doc.synopsis}
          </p>
          {(doc.genres ?? []).length > 0 && (
            <p className="mt-3 text-xs text-white/60">
              Géneros: {(doc.genres ?? []).join(" • ")}
            </p>
          )}
          {doc.cast && doc.cast.length > 0 && (
            <p className="text-xs text-white/60 mt-1">Reparto: {doc.cast.join(", ")}</p>
          )}
          <div className="mt-6">
            <TitleActions doc={doc} />
          </div>
        </div>
      </div>

      <RelatedTitles items={related} />

      <BrowseFooter />
    </div>
  );
}
