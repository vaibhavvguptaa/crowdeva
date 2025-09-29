import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Configure webpack for better code splitting
  webpack: (config, { isServer }) => {
    // Reduce bundle size by excluding unused locales from moment.js (if used)
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }
    
    // Add alias to prevent circular dependencies
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': require('path').resolve(__dirname, 'src'),
    };
    
    return config;
  },
  
  // Optimize bundle splitting
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'recharts',
      'chart.js',
      'react-chartjs-2',
      '@tanstack/react-query',
      '@dnd-kit/core',
      '@dnd-kit/sortable',
      '@dnd-kit/utilities'
    ]
  },
  
  async rewrites() {
    return [
      // Rewrite developer signin to main signin page
      {
        source: '/developer/signin',
        destination: '/signin',
      },
      // Rewrite vendor signin to main signin page  
      {
        source: '/vendor/signin',
        destination: '/signin',
      },
      // Rewrite developer signup to main signup page
      {
        source: '/developer/signup',
        destination: '/signup',
      },
      // Rewrite vendor signup to main signup page
      {
        source: '/vendor/signup', 
        destination: '/signup',
      },
    ];
  },
};

export default nextConfig;