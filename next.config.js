/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/.well-known/assetlinks.json',
        destination: '/api/assetlinks',
      },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'i.scdn.co' },
      { protocol: 'https', hostname: '*.spotifycdn.com' },
      { protocol: 'https', hostname: 'mosaic.scdn.co' },
      { protocol: 'https', hostname: 'image-cdn-ak.spotifycdn.com' },
      { protocol: 'https', hostname: 'image-cdn-fa.spotifycdn.com' },
      { protocol: 'https', hostname: 'thisis-images.spotifycdn.com' },
      { protocol: 'https', hostname: 'lineup-images.scdn.co' },
      { protocol: 'https', hostname: 'seeded-session-images.scdn.co' },
      { protocol: 'https', hostname: 'i.ytimg.com' },
    ],
  },
};

module.exports = nextConfig;
