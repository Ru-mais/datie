import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Datie. | Elite Malayali Dating',
    short_name: 'Datie.',
    description: 'The premium dating protocol for authentic Malayali connections.',
    start_url: '/',
    display: 'standalone',
    background_color: '#09090b',
    theme_color: '#000000',
    orientation: 'portrait',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
