import { auth } from "@/lib/auth";
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

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isProtected = PROTECTED.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
  if (isProtected && !req.auth) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
