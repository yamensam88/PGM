// next.config.ts

const nextConfig = {
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors. Vercel enforces strict linting otherwise.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
