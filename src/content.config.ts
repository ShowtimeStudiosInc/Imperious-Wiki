import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { docsLoader } from '@astrojs/starlight/loaders';
import { docsSchema } from '@astrojs/starlight/schema';

const move = z.object({
  name: z.string().nullable(),
  tags: z.array(z.string()).default([]),
  cost: z.number().nullable().default(null),
  text: z.string(),
});
const ability = move.extend({
  section: z.string(),
  moves: z.array(move).default([]),
});
const stats = z.object({ hp: z.number(), atk: z.number(), def: z.number(), spd: z.number(), int: z.number(), mag: z.number() });

export const collections = {
  docs: defineCollection({ loader: docsLoader(), schema: docsSchema() }),
  gemTypes: defineCollection({
    loader: glob({ pattern: '*.yml', base: './src/data/gem-types' }),
    schema: z.object({
      name: z.string(),
      slug: z.string(),
      rank: z.string().nullable(),
      side: z.enum(['Aristocratic', 'Authoritative']).nullable().optional(),
      faction: z.enum(['gempire', 'united-frontier', 'lost', 'rogue']),
      kind: z.enum(['standard', 'sub-type', 'fusion', 'geode', 'alloy', 'group']),
      parent: z.string().nullable().optional(),
      components: z.array(z.string()).nullable().optional(),
      variant: z.string().nullable().optional(),
      era: z.string().nullable().optional(),
      species: z.enum(['gem', 'metal']),
      status: z.array(z.string()).default([]),
      traits: z.array(z.string()).default([]),
      court: z.string().nullable().optional(),
      threatClass: z.string().nullable().optional(),
      height: z.string().nullable().optional(),
      stats: stats.nullable(),
      abilities: z.array(ability).default([]),
      extraBlocks: z.array(z.object({ title: z.string(), lines: z.array(z.string()) })).optional(),
      role: z.string(),
      interactions: z.string().nullable().optional(),
      notes: z.array(z.string()).optional(),
      description: z.string().nullable().optional(),
      image: z.string().nullable().optional(),
      gemstone: z.string().nullable().optional(),
      credit: z.string().nullable().optional(),
      attachments: z.array(z.string()).optional(),
      modifiers: z.record(z.string(), z.number()).optional(),
      shiftOf: z.string().optional(),
      updated: z.string().optional(),
    }),
  }),
};
