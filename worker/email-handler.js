// ============================================================
//  Cloudflare Email Worker handler — penerima email masuk
// ============================================================
// Dipanggil oleh Cloudflare Email Routing saat ada email masuk ke
// *@qmail.lol. Tugasnya: parse email -> cek alamat terdaftar di D1
// -> simpan ke tabel emails. Semua di Cloudflare, tanpa cPanel/Rumahweb.
//
// Di-wire ke worker utama lewat opennext (lihat open-next.config / wrangler.toml
// "send_email" tidak diperlukan; cukup trigger email). Fungsi email() ini
// di-export dari worker entry (lihat catatan di PANDUAN-DEPLOY.txt).

import PostalMime from "postal-mime";

/**
 * Handler email Cloudflare Email Routing.
 * @param {ForwardableEmailMessage} message
 * @param {{ DB: D1Database }} env
 */
export async function handleEmail(message, env) {
  // alamat tujuan (yang dikirimi email) & pengirim
  const to = String(message.to || "").toLowerCase().trim();
  const from = String(message.from || "").trim();

  // Parse isi email mentah (MIME) -> subject, text, html
  let subject = "(Tanpa subject)";
  let text = "";
  let html = "";
  try {
    const parsed = await PostalMime.parse(message.raw);
    subject = (parsed.subject || "(Tanpa subject)").trim();
    text = (parsed.text || "").trim();
    html = (parsed.html || "").trim();
  } catch (e) {
    // Kalau parse gagal, tetap simpan seadanya (jangan buang email).
    text = "(Gagal parse isi email)";
  }

  if (!to || !from) {
    // tanpa to/from tidak ada yang bisa disimpan; tolak secara halus.
    return;
  }

  // Hanya simpan kalau alamat tujuan TERDAFTAR (dibuat user lewat web).
  const addr = await env.DB
    .prepare("SELECT id FROM addresses WHERE email = ? LIMIT 1")
    .bind(to)
    .first();

  if (!addr) {
    // Alamat tidak terdaftar -> abaikan (bisa juga message.setReject()).
    return;
  }

  const finalBody = text || html || "(Isi email kosong)";

  await env.DB
    .prepare(
      `INSERT INTO emails (address_email, sender, subject, body, html_body)
       VALUES (?, ?, ?, ?, ?)`
    )
    .bind(to, from, subject, finalBody, html || null)
    .run();
}
