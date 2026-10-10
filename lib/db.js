// ============================================================
//  Akses database Cloudflare D1 (menggantikan MySQL/mysql2)
// ============================================================
// Binding D1 bernama "DB" (lihat wrangler.toml). Di runtime Cloudflare,
// binding diakses lewat getCloudflareContext().env dari OpenNext.
//
// Helper ini menyediakan 2 fungsi:
//   getDB()                      -> ambil instance D1 (binding env.DB)
//   query(sql, params)           -> jalankan SELECT, return array of rows
//   run(sql, params)             -> jalankan INSERT/UPDATE/DELETE, return meta
//                                    { changes, last_row_id }
//
// Catatan: D1 pakai '?' sebagai placeholder (sama seperti MySQL), jadi SQL
// hampir tidak berubah. Yang beda hanya cara memanggil (prepare/bind/all/run).

import { getCloudflareContext } from "@opennextjs/cloudflare";

export function getDB() {
  const { env } = getCloudflareContext();
  if (!env || !env.DB) {
    throw new Error(
      "Binding D1 'DB' tidak ditemukan. Pastikan wrangler.toml punya " +
        "[[d1_databases]] binding = \"DB\"."
    );
  }
  return env.DB;
}

// SELECT -> kembalikan array baris (mirip rows pada mysql2)
export async function query(sql, params = []) {
  const db = getDB();
  const stmt = db.prepare(sql).bind(...params);
  const { results } = await stmt.all();
  return results || [];
}

// INSERT/UPDATE/DELETE -> kembalikan { changes, last_row_id }
export async function run(sql, params = []) {
  const db = getDB();
  const stmt = db.prepare(sql).bind(...params);
  const res = await stmt.run();
  const meta = res?.meta || {};
  return {
    changes: meta.changes ?? 0,
    last_row_id: meta.last_row_id ?? null,
  };
}

const dbApi = { getDB, query, run };
export default dbApi;
