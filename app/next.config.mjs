/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: { bodySizeLimit: "1mb" },
  },
  // profile.ts reads ../data/profiles/*.yml via fs at request time, with a
  // path built from process.cwd() at runtime rather than a static import —
  // Vercel's serverless file tracer can't always see that and may leave the
  // YAML files out of the deployed function bundle. This explicitly forces
  // them in regardless of what the tracer infers.
  outputFileTracingIncludes: {
    "/**": ["../data/profiles/**"],
  },
};
export default nextConfig;
