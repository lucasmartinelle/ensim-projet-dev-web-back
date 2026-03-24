import { z } from 'zod';

export const SubmitScoreSchema = z.object({
    value: z.number().int().min(0, 'Le score doit être un entier positif'),
});

export type SubmitScoreInput = z.infer<typeof SubmitScoreSchema>;
