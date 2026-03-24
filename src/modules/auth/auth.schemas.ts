import { z } from 'zod';

export const RegisterSchema = z.object({
    email: z.string().email('Adresse email invalide'),
    username: z
        .string()
        .min(3, "Le nom d'utilisateur doit contenir au moins 3 caractères")
        .max(20, "Le nom d'utilisateur ne peut pas dépasser 20 caractères")
        .regex(/^[a-zA-Z0-9_]+$/, "Le nom d'utilisateur ne peut contenir que des lettres, chiffres et underscores"),
    password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
});

export const LoginSchema = z.object({
    email: z.string().email('Adresse email invalide'),
    password: z.string().min(1, 'Le mot de passe est requis'),
});

export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
