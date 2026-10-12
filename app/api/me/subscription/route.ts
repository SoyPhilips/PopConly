import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getActiveSubscription } from "@/lib/billing";
import { getBillingDb } from "@/lib/mysql";

/** GET /api/me/subscription → { active, planCode?, currentPeriodEnd?, payment? }.
 *  `billing:false` = aún sin MySQL: el front no bloquea nada (modo visual). */
export async function GET() {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!getBillingDb()) return NextResponse.json({ active: true, billing: false });
  const sub = await getActiveSubscription(userId);
  return NextResponse.json({
    active: Boolean(sub),
    planCode: sub?.planCode ?? null,
    currentPeriodEnd: sub?.currentPeriodEnd ?? null,
    payment: sub
      ? { method: sub.payMethod, brand: sub.payBrand, last4: sub.payLast4 }
      : null,
    billing: true,
  });
}
