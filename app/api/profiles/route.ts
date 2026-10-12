import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** GET /api/profiles → perfiles de reproducción del usuario. */
export async function GET() {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  let profiles = await prisma.profile.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });
  if (profiles.length === 0) {
    const created = await prisma.profile.create({
      data: { userId, name: "Principal", kind: "adult" },
    });
    profiles = [created];
  }
  return NextResponse.json({
    profiles: profiles.map((p) => ({ id: p.id, name: p.name, kind: p.kind })),
  });
}

/** POST /api/profiles { name, kind? } → crea un perfil. */
export async function POST(req: Request) {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = (await req.json().catch(() => null)) as {
    name?: string;
    kind?: string;
  } | null;
  const name = (body?.name ?? "").trim().slice(0, 24);
  if (!name) return NextResponse.json({ error: "bad-request" }, { status: 400 });
  try {
    const created = await prisma.profile.create({
      data: { userId, name, kind: (body?.kind ?? "adult").slice(0, 16) },
    });
    return NextResponse.json({ id: created.id, name: created.name, kind: created.kind });
  } catch {
    return NextResponse.json({ error: "duplicate" }, { status: 409 });
  }
}

/** PUT /api/profiles { id, name } → renombra un perfil propio (queda en DB). */
export async function PUT(req: Request) {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = (await req.json().catch(() => null)) as {
    id?: string;
    name?: string;
  } | null;
  const name = (body?.name ?? "").trim().slice(0, 24);
  if (!body?.id || !name) {
    return NextResponse.json({ error: "bad-request" }, { status: 400 });
  }
  try {
    const updated = await prisma.profile.updateMany({
      where: { id: body.id, userId },
      data: { name },
    });
    if (updated.count === 0) {
      return NextResponse.json({ error: "not-found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, id: body.id, name });
  } catch {
    return NextResponse.json({ error: "duplicate" }, { status: 409 });
  }
}
