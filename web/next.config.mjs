/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["@coral-xyz/anchor"],
  },
  images: {
    domains: ['pbs.twimg.com', 'abs.twimg.com', 'ton.twimg.com', 'i0.wp.com',  'source.boringavatars.com'],

  },
};

export default nextConfig;