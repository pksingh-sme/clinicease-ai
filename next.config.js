/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React strict mode for better development experience
  reactStrictMode: true,
  
  // Enable SWC minification for better performance
  swcMinify: true,
  
  // Optimize images
  images: {
    domains: ['localhost', 'your-domain.vercel.app'],
    formats: ['image/webp', 'image/avif'],
  },
  
  // Development optimizations
  ...(process.env.NODE_ENV === 'development' && {
    // Faster development builds
    optimizeFonts: false,
    // Optimize module resolution
    webpack: (config, { dev, isServer }) => {
      if (dev && !isServer) {
        // Optimize module resolution
        config.resolve.symlinks = false
      }
      
      // Optimize for production
      if (!isServer) {
        config.resolve.fallback = {
          ...config.resolve.fallback,
          fs: false,
          net: false,
          tls: false,
        }
      }
      
      return config
    },
  }),
  
  // Production optimizations
  ...(process.env.NODE_ENV === 'production' && {
    // Enable experimental features for better performance
    experimental: {
      // Server components
      serverComponentsExternalPackages: ['prisma', '@prisma/client'],
    },
  }),
  
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ]
  },
  
  // Redirects for better SEO
  async redirects() {
    return [
      {
        source: '/dashboard',
        destination: '/dashboard',
        permanent: false,
        has: [
          {
            type: 'cookie',
            key: 'user-role',
            value: 'PATIENT',
          },
        ],
      },
    ]
  },
  
  // Environment variables validation
  env: {
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  },
  
  // Output configuration for Vercel
  output: 'standalone',
  
  // Disable powered by header for security
  poweredByHeader: false,
  
  // Compress responses
  compress: true,
  
  // Enable HTTP/2 push for resources
  generateBuildId: async () => {
    // Generate unique build ID for cache busting
    return `clinicease-${Date.now()}`
  },
}

module.exports = nextConfig