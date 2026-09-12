/** @type {import('next').NextConfig} */
module.exports = { reactStrictMode: true, experimental: { outputFileTracingIncludes: { '/api/**': ['./agents/**', './skills/**', './knowledge/**'] } } };
