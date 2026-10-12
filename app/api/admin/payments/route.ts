import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { listManualPending, resolveManualPayment } from "@/lib/billing";
import { getBillingDb } from "@/lib/mysql";

/** Panel admin demo: con ADMIN_KEY se exige x-admin-key; sin ella (dev) es abierto. */
function adminOk(req: Request) {
  const required = process.env.ADMIN_KEY ?? "";
  if (!required) return true;
  return req.headers.get("x-admin-key") === required;
}

/** GET /api/admin/payments → pendientes de revisión manual. */
export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!adminOk(req)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  if (!getBillingDb()) return NextResponse.json({ billing: false, items: [] });
  return NextResponse.json({ billing: true, items: await listManualPending() });
}

/** POST /api/admin/payments { paymentId, action:"approve"|"reject" } */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!adminOk(req)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const body = (await req.json().catch(() => null)) as {
    paymentId?: string;
    action?: string;
  } | null;
  if (!body?.paymentId || (body.action !== "approve" && body.action !== "reject")) {
    return NextResponse.json({ error: "bad-request" }, { status: 400 });
  }
  const ok = await resolveManualPayment(body.paymentId, body.action === "approve");
  return NextResponse.json({ ok });
}
