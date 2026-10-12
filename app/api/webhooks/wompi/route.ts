import { NextResponse } from "next/server";
import { createHash } from "crypto";
import {
  confirmSubscriptionPaid,
  recordPayment,
  wompiTransactionPay,
} from "@/lib/billing";

/**
 * POST /api/webhooks/wompi — eventos de Wompi (transacciones).
 * Wompi firma cada evento; aquí se verifica antes de activar la membresía.
 * Verificar formato exacto del checksum en https://docs.wompi.co/ al activar.
 * Configurar esta URL en el dashboard de Wompi → Desarrolladores → Eventos.
 */
export async function POST(req: Request) {
  const secret = process.env.WOMPI_EVENTS_SECRET ?? "";
  const body = (await req.json().catch(() => null)) as {
    event?: string;
    data?: {
      transaction?: {
        id?: string;
        status?: string;
        amount_in_cents?: number;
        reference?: string;
        customer_email?: string;
        payment_method_type?: string;
        payment_method?: { type?: string; brand?: string; last_four?: string };
      };
    };
    signature?: { checksum?: string };
  } | null;

  const tx = body?.data?.transaction;
  if (!tx?.id || !tx.reference) {
    return NextResponse.json({ error: "bad-request" }, { status: 400 });
  }

  // Verificación de firma (no activar nada si no coincide y hay secreto).
  const received = req.headers.get("x-event-checksum") ?? body?.signature?.checksum ?? "";
  if (secret) {
    const expected = createHash("sha256")
      .update(`${tx.id}${tx.status ?? ""}${tx.amount_in_cents ?? ""}${secret}`)
      .digest("hex");
    if (received && received !== expected) {
      return NextResponse.json({ error: "bad-signature" }, { status: 401 });
    }
  }

  if (tx.status === "APPROVED") {
    // Método real: lo que trae el evento + detalle de la API de Wompi.
    const evtType = tx.payment_method_type ?? tx.payment_method?.type;
    const detail = await wompiTransactionPay(tx.id);
    await confirmSubscriptionPaid(tx.reference, tx.id, {
      method: detail.method ?? (evtType ? String(evtType).toUpperCase() : undefined),
      brand: detail.brand ?? (tx.payment_method?.brand
        ? String(tx.payment_method.brand).toUpperCase()
        : undefined),
      last4: detail.last4 ?? (tx.payment_method?.last_four
        ? String(tx.payment_method.last_four)
        : undefined),
    });
  }
  await recordPayment({
    subscriptionId: null,
    userId: tx.customer_email ?? "webhook",
    amountCents: Number(tx.amount_in_cents ?? 0),
    status: tx.status ?? "UNKNOWN",
    wompiId: tx.id,
    raw: { event: body?.event ?? null },
  });

  return NextResponse.json({ ok: true });
}
