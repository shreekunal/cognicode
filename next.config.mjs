/** @type {import('next').NextConfig} */
const nextConfig = {
    basePath: '/cognicode',
    staticPageGenerationTimeout: 150,
    env: {
        NEXT_PUBLIC_BASE_PATH: '/cognicode'
    }
};

export default nextConfig;
