import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://scifinetworks.vercel.app';
  const staticPages = [
    '',
    '/packages',
    '/get-connected',
    '/track',
    '/status',
    '/about',
    '/contact',
    '/faq',
  ];

  return staticPages.map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
    changeFrequency: path === '' ? 'daily' : 'weekly',
    priority: path === '' ? 1 : 0.7,
  }));
}
