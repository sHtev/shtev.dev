import { defineCollection } from 'astro:content';
import { file, glob } from 'astro/loaders';
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

// A link may be a full URL or a path on this site (the thesis PDF).
const link = z.union([z.url(), z.string().startsWith('/')]);

const publications = defineCollection({
  loader: file('./src/content/publications.yaml'),
  schema: z
    .object({
      title: z.string(),
      authors: z.array(z.string()).min(1),
      venue: z.string().optional(),
      venueNote: z.string().optional(),
      year: z.number().int(),
      group: z.enum(['phd', 'crossmodal', 'affective', 'bci']),
      kind: z.enum(['thesis', 'paper', 'journal', 'edited', 'report']),
      doi: z.url().optional(),
      openUrl: link.optional(),
      selected: z.boolean(),
      order: z.number().int().optional(),
      summary: z.string().optional(),
    })
    .refine((p) => !p.selected || (p.summary !== undefined && p.order !== undefined), {
      message: 'selected publications need a summary and an order',
    }),
});

export const collections = { pages, caseStudies, projects, publications };
