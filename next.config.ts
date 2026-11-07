import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    localPatterns: [
      { pathname: '/photos/**', search: '?v=20260923-2' },
      { pathname: '/photos/**', search: '?v=20261107' },
      { pathname: '/**', search: '' },
    ],
  },
};

export default nextConfig;
