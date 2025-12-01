import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  eslint: {
    // Disable lint checks during builds and dev preview
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
