import { useEffect, useRef } from "react";

/** Al empezar o limpiar una búsqueda, vuelve al inicio de la sección. */
export function useSearchScroll(query: string) {
  const prev = useRef(query);
  useEffect(() => {
    const wasEmpty = prev.current.trim() === "";
    const isEmpty = query.trim() === "";
    if (wasEmpty !== isEmpty) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    prev.current = query;
  }, [query]);
}
