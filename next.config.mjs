/** @type {import('next').NextConfig} */
const nextConfig = {
  // Official kit JS client is vendored under third_party/vexo-open-kit (MIT).
  // Imports use relative paths from src/lib/vexo.
  // Next 16 may auto-write AGENTS.md; keep our repo AGENTS.md unchanged.
  agentRules: false,
};

export default nextConfig;
