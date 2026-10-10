// ============================================================
//  Worker entry gabungan: Next.js (OpenNext) + Email handler
// ============================================================
// OpenNext meng-generate worker Next.js di ".open-next/worker.js".
// Di sini kita bungkus: pakai handler fetch dari OpenNext untuk web,
// dan tambahkan handler email() untuk Cloudflare Email Routing.
//
// wrangler.toml -> main = "worker/index.js"

import nextWorker from "../.open-next/worker.js";
import { handleEmail } from "./email-handler.js";

export default {
  // Request HTTP (web app Next.js) diteruskan ke worker OpenNext.
  async fetch(request, env, ctx) {
    return nextWorker.fetch(request, env, ctx);
  },

  // Email masuk dari Cloudflare Email Routing.
  async email(message, env, ctx) {
    await handleEmail(message, env);
  },
};

// Re-export Durable Object (DOQueueHandler, dll) yang dibutuhkan OpenNext,
// kalau ada. OpenNext worker meng-export beberapa named export untuk DO.
export * from "../.open-next/worker.js";
