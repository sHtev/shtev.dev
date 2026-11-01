import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const pages = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/pages' }),
  schema: z.object({
    title: z.string(),
    command: z.string(),
    draft: z.boolean(),
  }),
});

const caseStudies = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/case-studies' }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    order: z.number(),
    draft: z.boolean(),
  }),
});

const projects = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    url: z.url().optional(),
    repo: z.url().optional(),
    order: z.number(),
    draft: z.boolean(),
  }),
});

export const collections = { pages, caseStudies, projects };
