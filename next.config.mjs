/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
};

export default nextConfig;

// Integrasi OpenNext Cloudflare untuk dev lokal: supaya `next dev` bisa
// mengakses binding Cloudflare (D1 "DB") lewat getCloudflareContext().
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev();
