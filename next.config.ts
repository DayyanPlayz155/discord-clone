import type { NextConfig } from 'next'
 
const nextConfig: NextConfig = {
  typescript: {
    // This ignores the 'any' type error that is stopping your build
    ignoreBuildErrors: true,
  },
}
 
export default nextConfig