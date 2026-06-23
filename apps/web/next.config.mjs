/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    "@agenttoruk/database",
    "@agenttoruk/shared",
    "@agenttoruk/llm",
    "@agenttoruk/rag",
    "@agenttoruk/agent-engine",
  ],
};

export default nextConfig;
