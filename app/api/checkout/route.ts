import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { auth } from "@/lib/auth";
import {
  WOMPI_API,
  createPendingSubscription,
  planAmountCents,
  recordPayment,
  wompiConfigured,
} from "@/lib/billing";

/**
 * POST /api/checkout { planId, cardToken?, installments?, customerName?, customerEmail? }
 * - Sin llaves Wompi o sin MySQL → { mode:"visual" } (el front sigue como hoy).
 * - Con llaves: crea suscripción `pending` y cobra en Wompi (sandbox o producción
 *   según WOMPI_ENV). La tarjeta NUNCA llega aquí cruda: el front la tokeniza
 *   con la llave pública (ver app/signup/payment).
 */
export async function POST(req: Request) {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  const sessionEmail = session?.user?.email ?? "";
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as {
    planId?: string;
    cardToken?: string;
    installments?: number;
    customerName?: string;
    customerEmail?: string;
  } | null;
  const planId = body?.planId ?? "plus";
  const amount = planAmountCents(planId);
  const reference = `popconly-${userId.slice(-6)}-${Date.now().toString(36)}`;

  if (!wompiConfigured()) {
    // Sin llaves Wompi (flujo por links): igual se deja la suscripción `pending`
    // para que el webhook la active por referencia cuando llegue el pago.
    await createPendingSubscription(userId, planId, reference).catch(() => null);
    return NextResponse.json({ mode: "visual", reference });
  }

  const { id: subscriptionId } = await createPendingSubscription(userId, planId, reference);

  // Verificar payloads contra https://docs.wompi.co/ al activar llaves reales.
  const payload = {
    amount_in_cents: amount,
    currency: "COP",
    customer_email: body?.customerEmail ?? sessionEmail,
    payment_method: {
      type: "CARD",
      installments: Number(body?.installments ?? 1),
      token: body?.cardToken,
    },
    reference,
    redirect_url: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/browse`,
  };

  try {
    const res = await fetch(`${WOMPI_API}/transactions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.WOMPI_PRIVATE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    const data = (await res.json().catch(() => null)) as {
      data?: { id?: string; status?: string };
      error?: unknown;
    } | null;
    const txId = data?.data?.id;
    const status = data?.data?.status ?? "UNKNOWN";
    await recordPayment({
      subscriptionId,
      userId,
      amountCents: amount,
      status,
      wompiId: txId,
      raw: data,
    });
    if (!res.ok || !txId) {
      return NextResponse.json(
        { error: "wompi-rejected", detail: data?.error ?? null },
        { status: 502 }
      );
    }
    return NextResponse.json({
      mode: "wompi",
      status,
      transactionId: txId,
      subscriptionId,
    });
  } catch {
    return NextResponse.json({ error: "wompi-unreachable" }, { status: 502 });
  }
}

export function wompiChecksum(...parts: (string | number)[]): string {
  return createHash("sha256").update(parts.join("")).digest("hex");
}
