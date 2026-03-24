import { z } from 'zod';

export const CreateMatchSchema = z.object({
    gameId: z.string().uuid('gameId doit être un UUID valide'),
});

export type CreateMatchInput = z.infer<typeof CreateMatchSchema>;
