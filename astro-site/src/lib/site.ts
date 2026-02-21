import type { CollectionEntry } from 'astro:content';
import type { Locale } from '@/types/locale';

export const SITE_NAME = 'Yanlin (Leo) Liu';
export const SITE_TAGLINE_ZH = '替代数据、金融风险与可解释 AI';
export const SITE_TAGLINE_EN = 'Alternative Data, Financial Risk, and Explainable AI';

export const navMap: Record<Locale, { label: string; href: string }[]> = {
  zh: [
    { label: '首页', href: '/' },
    { label: '博客', href: '/blog/' },
    { label: '关于', href: '/about/' },
    { label: '简历', href: '/cv/' }
  ],
  en: [
    { label: 'Home', href: '/en/' },
    { label: 'Blog', href: '/en/blog/' },
    { label: 'About', href: '/en/about/' },
    { label: 'CV', href: '/en/cv/' }
  ]
};

export function sortBlogByDate(entries: CollectionEntry<'blog'>[]) {
  return entries.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

export function localePrefix(locale: Locale) {
  return locale === 'zh' ? '' : '/en';
}

export function pagePath(locale: Locale, slug: string) {
  const prefix = localePrefix(locale);
  if (slug === 'home') return locale === 'zh' ? '/' : '/en/';
  return `${prefix}/${slug}/`.replace(/\/{2,}/g, '/');
}

export function blogPath(locale: Locale, slug: string) {
  const prefix = localePrefix(locale);
  return `${prefix}/blog/${slug}/`.replace(/\/{2,}/g, '/');
}
