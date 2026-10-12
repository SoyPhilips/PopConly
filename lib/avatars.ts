/** Avatares personalizados generados por el equipo.
 *
 *  Flujo: genera cada personaje en cuadrado 1:1 (PNG), guárdalo como
 *  public/avatars/<id>.png y registra UNA línea aquí:
 *    { id: "deadpool", label: "Deadpool", src: "/avatars/deadpool.png" },
 *  Quedan en git, se despliegan solos y la DB guarda la ruta elegida.
 */
export type CustomAvatar = {
  id: string;
  label: string;
  src: string;
};

export const CUSTOM_AVATARS: CustomAvatar[] = [
  // Personajes generados por el equipo (vacío hasta la primera entrega).
];
