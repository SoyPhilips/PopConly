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
  { id: "deadpool", label: "Deadpool", src: "/avatars/deadpool.png" },
  { id: "wolverine", label: "Wolverine", src: "/avatars/wolverine.png" },
  { id: "spiderman", label: "Spider-Man", src: "/avatars/spiderman.png" },
  { id: "john-wick", label: "John Wick", src: "/avatars/john-wick.png" },
  { id: "vault-boy", label: "Vault Boy", src: "/avatars/vault-boy.png" },
  { id: "cobra-kai", label: "Cobra Kai", src: "/avatars/cobra-kai.png" },
  { id: "gladiator", label: "Gladiator II", src: "/avatars/gladiator.png" },
];
