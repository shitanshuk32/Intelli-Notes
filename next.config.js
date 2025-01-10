/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        domains: ['yxntxrftuuekyetyyfbs.supabase.co']
    },
    typescript: {
        ignoreBuildErrors: true,
    },
    eslint: {
        ignoreDuringBuilds: true,
    },
}

module.exports = nextConfig 