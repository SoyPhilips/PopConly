/** Slug estable en español para URLs /titulo/[slug]. */
export function slugify(title: string): string {
  return norm(title)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** Minúsculas sin tildes: para comparar géneros/búsquedas sin importar acentos. */
export function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}
