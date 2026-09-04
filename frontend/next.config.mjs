/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Keep Vercel/Next tracing scoped to this standalone frontend when another
  // package-lock.json exists higher in the user's Windows home directory.
  outputFileTracingRoot: process.cwd(),
};

export default nextConfig;
