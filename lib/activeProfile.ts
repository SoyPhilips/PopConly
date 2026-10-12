/** Perfil activo compartido entre /profile, /browse y /watch.
 *  Se guarda en localStorage para que el progreso (línea roja) y las
 *  recomendaciones sean por perfil, como en Netflix. */

const KEY = "popconly:active-profile";
const FALLBACK = "Principal";

export function getActiveProfile(): string {
  if (typeof window === "undefined") return FALLBACK;
  try {
    return window.localStorage.getItem(KEY) || FALLBACK;
  } catch {
    return FALLBACK;
  }
}

export function setActiveProfile(name: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, name || FALLBACK);
  } catch {
    /* almacenamiento no disponible */
  }
}

export function profileQuery(name?: string): string {
  return encodeURIComponent(name || getActiveProfile() || FALLBACK);
}
