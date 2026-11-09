import { z, defineCollection } from 'astro:content';

const researchsCollection = defineCollection({
    type: 'data',
    schema: z.object({
        id: z.string().optional(),
        title: z.string(),
        volume: z.number().optional(),
        ISSN: z.string().optional(),
        url: z.string(),
        DOI: z.string().optional(),
        number: z.number().optional(),
        journal: z.string(),
        publisher: z.string(),
        author: z.array(z.string()),
        year: z.number(),
        month: z.string()
    })
});

const projectsCollections = defineCollection({
    type: 'content',
    schema: z.object({
        title: z.string(),
        pubDate: z.date(),
        summary: z.string(),
        cover: z.string().optional()
    })
})
export const collections = {
    'researchs': researchsCollection,
    'projects': projectsCollections
};