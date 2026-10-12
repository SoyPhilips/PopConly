import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

const PROTECTED = [
  "/browse",
  "/movies",
  "/series",
  "/categories",
  "/my-list",
  "/profile",
  "/watch",
  "/search",
];

// Rutas que una cuenta INCOMPLETA (clic mágico sin contraseña) sí puede pisar.
const INCOMPLETE_ALLOW = ["/signup/password"];

export default auth(async (req) => {
  const { pathname } = req.nextUrl;
  const isProtected = PROTECTED.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
  if (isProtected && !req.auth) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }
  // La cuenta nace al poner la contraseña: sin ella, todo lleva a completarla.
  // Cerrar la pestaña no sirve de atajo (la sesión sigue incompleta).
  const userId = (req.auth?.user as { id?: string } | undefined)?.id;
  if (userId) {
    const allowed =
      INCOMPLETE_ALLOW.some(
        (p) => pathname === p || pathname.startsWith(`${p}/`)
      ) || pathname.startsWith("/api/auth/");
    if (!allowed) {
      try {
        const u = await prisma.user.findUnique({
          where: { id: userId },
          select: { passwordHash: true },
        });
        if (u && !u.passwordHash) {
          const url = req.nextUrl.clone();
          url.pathname = "/signup/password";
          url.search = "";
          return NextResponse.redirect(url);
        }
      } catch {
        /* sin DB: no se bloquea */
      }
    }
  }
  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
