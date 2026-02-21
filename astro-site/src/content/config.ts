import { defineCollection, z } from 'astro:content';

const localeEnum = z.enum(['zh', 'en']);

const pages = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    routeSlug: z.string(),
    locale: localeEnum,
    seoTitle: z.string(),
    seoDescription: z.string()
  })
});

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    date: z.date(),
    canonicalSlug: z.string(),
    tags: z.array(z.string()),
    locale: localeEnum,
    cover: z.string()
  })
});

export const collections = {
  pages,
  blog
};
