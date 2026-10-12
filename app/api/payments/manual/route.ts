import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { planAmountCents, reportManualPayment } from "@/lib/billing";

/** POST /api/payments/manual { planId, reference, senderName }.
 *  El usuario transfirió por Nequi y reporta el comprobante.
 *  Sin MySQL → { mode:"visual-local" } (el front lo guarda en demo local). */
export async function POST(req: Request) {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as {
    planId?: string;
    reference?: string;
    senderName?: string;
    method?: string;
  } | null;
  if (!body?.planId || !body.reference?.trim() || !body.senderName?.trim()) {
    return NextResponse.json({ error: "bad-request" }, { status: 400 });
  }

  const { stored } = await reportManualPayment(
    userId,
    body.planId,
    body.reference.trim(),
    body.senderName.trim(),
    body.method === "wompi" ? "wompi" : "nequi"
  );
  if (!stored) {
    return NextResponse.json({
      mode: "visual-local",
      amountCents: planAmountCents(body.planId),
    });
  }
  return NextResponse.json({ mode: "stored", amountCents: planAmountCents(body.planId) });
}
