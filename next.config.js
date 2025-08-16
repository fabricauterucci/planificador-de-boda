/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // output: 'export', // Comentado para permitir API Routes
  images: {
    unoptimized: true
  }
};
module.exports = nextConfig;
