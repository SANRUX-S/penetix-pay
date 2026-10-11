import type { NextConfig } from 'next';
const policy = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'";
const config: NextConfig = { poweredByHeader: false, async headers() { return [{ source: '/:path*', headers: [
{ key: 'Content-Security-Policy', value: policy }, { key: 'X-Content-Type-Options', value: 'nosniff' },
{ key: 'Referrer-Policy', value: 'no-referrer' }, { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' }
]}]; }};
export default config;
