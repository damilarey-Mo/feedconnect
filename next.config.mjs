/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // For static site generation
  images: {
    unoptimized: true, // Required for static exports
  },
  typescript: {
    ignoreBuildErrors: true, // Temporarily ignore TypeScript errors during build
  },
  eslint: {
    ignoreDuringBuilds: true, // Temporarily ignore ESLint errors during build
  },
  // Disable API routes for static export
  experimental: {
    appDocumentPreloading: false,
    // Explicitly ignore API routes during build
    outputFileTracingExcludes: {
      '*': [
        './src/app/api/**/*',
      ],
    },
  },
  // Better compatibility with PHP servers
  trailingSlash: true,
};

export default nextConfig; 