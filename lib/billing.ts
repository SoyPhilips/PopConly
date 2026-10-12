import { getBillingDb, uid } from "./mysql";
import { PLANS, type PlanId } from "./plans";

export type Subscription = {
  id: string;
  userId: string;
  planCode: string;
  status: "pending" | "active" | "past_due" | "cancelled";
  wompiReference: string | null;
  wompiTransactionId: string | null;
  currentPeriodEnd: string | null;
  payMethod: string | null;
  payBrand: string | null;
  payLast4: string | null;
};

const WOMPI_API = (process.env.WOMPI_ENV === "production"
  ? "https://production.wompi.co/v1"
  : "https://sandbox.wompi.co/v1") as string;

export function wompiConfigured(): boolean {
  return Boolean(process.env.WOMPI_PUBLIC_KEY && process.env.WOMPI_PRIVATE_KEY);
}

/** Precio del plan en centavos COP (montos fijos definidos en lib/plans.ts). */
export function planAmountCents(planId: string): number {
  const p = PLANS.find((x) => x.id === (planId as PlanId)) ?? PLANS[1];
  return p.cop * 100;
}

export async function getActiveSubscription(
  userId: string
): Promise<Subscription | null> {
  const db = getBillingDb();
  if (!db) return null;
  try {
    const [rows] = await db.query(
      `SELECT * FROM subscriptions
       WHERE user_id = ? AND status = 'active' AND (current_period_end IS NULL OR current_period_end > NOW())
       ORDER BY updated_at DESC LIMIT 1`,
      [userId]
    );
    const list = rows as Record<string, unknown>[];
    if (list.length === 0) return null;
    const r = list[0];
    return {
      id: String(r.id),
      userId: String(r.user_id),
      planCode: String(r.plan_code),
      status: "active",
      wompiReference: (r.wompi_reference as string) ?? null,
      wompiTransactionId: (r.wompi_transaction_id as string) ?? null,
      currentPeriodEnd: r.current_period_end ? String(r.current_period_end) : null,
      payMethod: (r.pay_method as string) ?? null,
      payBrand: (r.pay_brand as string) ?? null,
      payLast4: (r.pay_last4 as string) ?? null,
    };
  } catch {
    return null;
  }
}

export async function createPendingSubscription(
  userId: string,
  planId: string,
  reference: string
) {
  const db = getBillingDb();
  const id = uid();
  if (!db) return { id, stored: false };
  try {
    await db.query(
      `INSERT INTO subscriptions (id, user_id, plan_code, status, wompi_reference)
       VALUES (?, ?, ?, 'pending', ?)`,
      [id, userId, planId, reference]
    );
    return { id, stored: true };
  } catch {
    return { id, stored: false };
  }
}

export async function confirmSubscriptionPaid(
  reference: string,
  wompiTransactionId: string,
  pay?: { method?: string; brand?: string; last4?: string }
) {
  const db = getBillingDb();
  if (!db) return false;
  try {
    await db.query(
      `UPDATE subscriptions
       SET status = 'active', wompi_transaction_id = ?,
           current_period_start = NOW(),
           current_period_end = DATE_ADD(NOW(), INTERVAL 30 DAY),
           pay_method = COALESCE(?, pay_method),
           pay_brand = COALESCE(?, pay_brand),
           pay_last4 = COALESCE(?, pay_last4)
       WHERE wompi_reference = ? AND status = 'pending'`,
      [
        wompiTransactionId,
        pay?.method ?? null,
        pay?.brand ?? null,
        pay?.last4 ?? null,
        reference,
      ]
    );
    return true;
  } catch {
    return false;
  }
}

export async function recordPayment(input: {
  subscriptionId: string | null;
  userId: string;
  amountCents: number;
  status: string;
  wompiId?: string;
  raw?: unknown;
}) {
  const db = getBillingDb();
  if (!db) return;
  try {
    await db.query(
      `INSERT INTO payments (id, subscription_id, user_id, amount_cents, currency, status, wompi_id, raw_json)
       VALUES (?, ?, ?, ?, 'COP', ?, ?, ?)`,
      [
        uid(),
        input.subscriptionId,
        input.userId,
        input.amountCents,
        input.status,
        input.wompiId ?? null,
        input.raw ? JSON.stringify(input.raw).slice(0, 8000) : null,
      ]
    );
  } catch {
    /* mejor esfuerzo */
  }
}

/* ---------- Pago manual (Nequi / transferencia) ---------- */

export async function reportManualPayment(
  userId: string,
  planId: string,
  reference: string,
  senderName: string,
  method = "nequi"
) {
  const db = getBillingDb();
  const id = uid();
  if (!db) return { id, stored: false };
  try {
    const ref = `nequi-${Date.now().toString(36)}`;
    await db.query(
      `INSERT INTO subscriptions (id, user_id, plan_code, status, wompi_reference)
       VALUES (?, ?, ?, 'pending', ?)`,
      [id, userId, planId, ref]
    );
    await db.query(
      `INSERT INTO payments (id, subscription_id, user_id, amount_cents, currency, status, raw_json)
       VALUES (?, ?, ?, ?, 'COP', 'manual_review', ?)`,
      [
        uid(),
        id,
        userId,
        planAmountCents(planId),
        JSON.stringify({ method, reference, senderName }),
      ]
    );
    return { id, stored: true };
  } catch {
    return { id, stored: false };
  }
}

export type ManualPending = {
  paymentId: string;
  subscriptionId: string | null;
  userId: string;
  planCode: string;
  amountCents: number;
  reference: string;
  senderName: string;
  createdAt: string;
};

export async function listManualPending(): Promise<ManualPending[]> {
  const db = getBillingDb();
  if (!db) return [];
  try {
    const [rows] = await db.query(
      `SELECT p.id AS paymentId, p.subscription_id AS subscriptionId,
              p.user_id AS userId, s.plan_code AS planCode,
              p.amount_cents AS amountCents, p.raw_json AS rawJson,
              p.created_at AS createdAt
       FROM payments p LEFT JOIN subscriptions s ON s.id = p.subscription_id
       WHERE p.status = 'manual_review'
       ORDER BY p.created_at DESC`
    );
    return (rows as Record<string, unknown>[]).map((r) => {
      let raw: Record<string, string> = {};
      try {
        raw = JSON.parse(String(r.rawJson ?? "{}")) as Record<string, string>;
      } catch {
        /* vacío */
      }
      return {
        paymentId: String(r.paymentId),
        subscriptionId: r.subscriptionId ? String(r.subscriptionId) : null,
        userId: String(r.userId),
        planCode: String(r.planCode ?? "?"),
        amountCents: Number(r.amountCents ?? 0),
        reference: raw.reference ?? "",
        senderName: raw.senderName ?? "",
        createdAt: String(r.createdAt ?? ""),
      };
    });
  } catch {
    return [];
  }
}

export async function resolveManualPayment(paymentId: string, approve: boolean) {
  const db = getBillingDb();
  if (!db) return false;
  try {
    const [rows] = await db.query(`SELECT subscription_id AS sub FROM payments WHERE id = ?`, [
      paymentId,
    ]);
    const list = rows as { sub: string | null }[];
    const subId = list[0]?.sub ?? null;
    await db.query(`UPDATE payments SET status = ? WHERE id = ?`, [
      approve ? "approved_manual" : "rejected_manual",
      paymentId,
    ]);
    if (subId) {
      if (approve) {
        await db.query(
          `UPDATE subscriptions SET status = 'active',
             current_period_start = NOW(),
             current_period_end = DATE_ADD(NOW(), INTERVAL 30 DAY),
             pay_method = COALESCE(pay_method, 'nequi')
           WHERE id = ?`,
          [subId]
        );
      } else {
        await db.query(`UPDATE subscriptions SET status = 'cancelled' WHERE id = ?`, [subId]);
      }
    }
    return true;
  } catch {
    return false;
  }
}

export { WOMPI_API };

/** Detalle de la transacción en Wompi → método de pago real (marca/últimos 4 si los expone).
 *  Wompi NUNCA entrega el número completo: solo tipo (CARD/NEQUI/PSE/...) y, a veces,
 *  marca + últimos 4 de la tarjeta. Requiere WOMPI_PRIVATE_KEY en el servidor. */
export async function wompiTransactionPay(
  txId: string
): Promise<{ method?: string; brand?: string; last4?: string }> {
  const key = process.env.WOMPI_PRIVATE_KEY ?? "";
  if (!key || !txId) return {};
  try {
    const res = await fetch(`${WOMPI_API}/transactions/${encodeURIComponent(txId)}`, {
      headers: { Authorization: `Bearer ${key}` },
    });
    if (!res.ok) return {};
    const data = (await res.json().catch(() => null)) as {
      data?: {
        payment_method_type?: string;
        payment_method?: {
          type?: string;
          brand?: string;
          last_four?: string;
          last4?: string;
        };
      };
    } | null;
    const pm = data?.data?.payment_method;
    const type = data?.data?.payment_method_type ?? pm?.type;
    if (!type && !pm?.brand) return {};
    return {
      method: type ? String(type).toUpperCase() : undefined,
      brand: pm?.brand ? String(pm.brand).toUpperCase() : undefined,
      last4: pm?.last_four ?? pm?.last4 ? String(pm.last_four ?? pm.last4) : undefined,
    };
  } catch {
    return {};
  }
}
