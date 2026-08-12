import type { MetadataRoute } from 'next'
import { chapterSlugs } from '@/lib/data'

const BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://the-disney-pantheon.vercel.app'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()
  const staticRoutes = ['', '/matrix', '/overrides', '/bonus', '/chapters']
  const chapters = chapterSlugs.map((slug) => `/chapters/${slug}`)
  return [...staticRoutes, ...chapters].map((path) => ({
    url: `${BASE}${path}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: path === '' ? 1 : 0.7,
  }))
}
