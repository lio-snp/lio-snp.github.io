import { getCollection, type CollectionEntry } from 'astro:content';
import type { Locale } from '@/types/locale';

export async function getPageEntry(locale: Locale, slug: string): Promise<CollectionEntry<'pages'>> {
  const entries = await getCollection(
    'pages',
    (entry) => entry.data.locale === locale && entry.data.routeSlug === slug
  );
  const page = entries[0];
  if (!page) {
    throw new Error(`Page not found: ${locale}/${slug}`);
  }
  return page;
}

export async function getBlogEntries(locale: Locale): Promise<CollectionEntry<'blog'>[]> {
  return getCollection('blog', (entry) => entry.data.locale === locale);
}

export async function getBlogEntry(locale: Locale, slug: string): Promise<CollectionEntry<'blog'> | undefined> {
  const entries = await getCollection(
    'blog',
    (entry) => entry.data.locale === locale && entry.data.canonicalSlug === slug
  );
  return entries[0];
}
