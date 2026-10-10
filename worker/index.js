// ============================================================
//  Worker entry gabungan: Next.js (OpenNext) + Email handler
// ============================================================
// Mengikuti pola resmi OpenNext "Custom Worker":
//   https://opennext.js.org/cloudflare/howtos/custom-worker
// Re-use fetch handler yang di-generate OpenNext, tambah email handler,
// dan re-export Durable Objects yang WAJIB (DOQueueHandler, DOShardedTagCache).

// @ts-ignore - .open-next/worker.js di-generate saat build
import { default as handler } from "../.open-next/worker.js";
import { handleEmail } from "./email-handler.js";

export default {
  // Request HTTP (web app Next.js)
  fetch: handler.fetch,

  // Email masuk dari Cloudflare Email Routing
  async email(message, env, ctx) {
    await handleEmail(message, env);
  },
};

// Re-export Durable Objects yang dipakai OpenNext (caching).
// WAJIB di-export dari entry worker, kalau tidak -> runtime error.
// Jumlah/namanya mengikuti yang di-generate .open-next/worker.js:
//   DOQueueHandler, DOShardedTagCache, BucketCachePurge
// @ts-ignore
export {
  DOQueueHandler,
  DOShardedTagCache,
  BucketCachePurge,
} from "../.open-next/worker.js";
