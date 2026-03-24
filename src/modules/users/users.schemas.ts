import { z } from 'zod';

export const UpdateProfileSchema = z
    .object({
        username: z
            .string()
            .min(3, "Le nom d'utilisateur doit contenir au moins 3 caractères")
            .max(20, "Le nom d'utilisateur ne peut pas dépasser 20 caractères")
            .regex(/^[a-zA-Z0-9_]+$/, "Le nom d'utilisateur ne peut contenir que des lettres, chiffres et underscores")
            .optional(),
        email: z.email('Adresse email invalide').optional(),
    })
    .refine((data) => data.username !== undefined || data.email !== undefined, {
        message: 'Au moins un champ (username ou email) doit être renseigné',
    });

export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;
