import { defineCloudflareConfig } from "@opennextjs/cloudflare";

export default defineCloudflareConfig({
  // Caching default (tanpa R2). Kalau nanti mau enable incremental cache,
  // lihat https://opennext.js.org/cloudflare/caching
});
