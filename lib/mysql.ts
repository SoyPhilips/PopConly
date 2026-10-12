import mysql, { type Pool } from "mysql2/promise";

let pool: Pool | null = null;

/** MySQL del Módulo 4. Sin MYSQL_URL devuelve null y el pago queda en modo visual. */
export function getBillingDb(): Pool | null {
  const url = process.env.MYSQL_URL;
  if (!url) return null;
  try {
    pool ??= mysql.createPool({ uri: url, connectionLimit: 5 });
    return pool;
  } catch {
    return null;
  }
}

export function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
