import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** GET /api/me/settings → { lang } (idioma guardado del usuario). */
export async function GET() {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  try {
    const u = await prisma.user.findUnique({
      where: { id: userId },
      select: { lang: true },
    });
    const lang = u?.lang === "en" ? "en" : "es";
    return NextResponse.json({ lang });
  } catch {
    return NextResponse.json({ lang: "es" });
  }
}

/** PUT /api/me/settings { lang: "es"|"en" } → persiste el idioma del usuario. */
export async function PUT(req: Request) {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = (await req.json().catch(() => null)) as { lang?: string } | null;
  const lang = body?.lang === "en" ? "en" : body?.lang === "es" ? "es" : null;
  if (!lang) return NextResponse.json({ error: "bad-request" }, { status: 400 });
  try {
    await prisma.user.update({ where: { id: userId }, data: { lang } });
    return NextResponse.json({ ok: true, lang });
  } catch {
    return NextResponse.json({ error: "db" }, { status: 503 });
  }
}
