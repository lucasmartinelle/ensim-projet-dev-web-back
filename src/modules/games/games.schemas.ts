import { z } from 'zod';

export const CreateGameSchema = z.object({
    name: z.string().min(1, 'Le nom est requis'),
    slug: z
        .string()
        .min(1, 'Le slug est requis')
        .regex(/^[a-z0-9-]+$/, 'Le slug ne peut contenir que des minuscules, chiffres et tirets'),
    description: z.string().optional(),
    coverImage: z.string().url('URL invalide').optional(),
});

export type CreateGameInput = z.infer<typeof CreateGameSchema>;

export const UpdateGameSchema = z
    .object({
        name: z.string().min(1, 'Le nom est requis').optional(),
        slug: z
            .string()
            .min(1, 'Le slug est requis')
            .regex(/^[a-z0-9-]+$/, 'Le slug ne peut contenir que des minuscules, chiffres et tirets')
            .optional(),
        description: z.string().optional(),
        coverImage: z.string().url('URL invalide').optional(),
    })
    .refine((data) => Object.keys(data).length > 0, { message: 'Au moins un champ est requis' });

export type UpdateGameInput = z.infer<typeof UpdateGameSchema>;
