import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcrypt';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('🌱 Démarrage du seed...');

    // Admin par défaut
    const adminEmail = process.env.ADMIN_EMAIL ?? 'admin@example.com';
    const adminPassword = process.env.ADMIN_PASSWORD ?? 'Admin1234!';

    const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });
    if (!existingAdmin) {
        const passwordHash = await bcrypt.hash(adminPassword, 10);
        await prisma.user.create({
            data: {
                email: adminEmail,
                username: 'admin',
                passwordHash,
                role: 'ADMIN',
            },
        });
        console.log(`✅ Admin créé : ${adminEmail}`);
    } else {
        console.log(`⏭️  Admin déjà existant : ${adminEmail}`);
    }

    // Jeux
    const games = [
        {
            name: 'Tic-Tac-Toe',
            slug: 'tic-tac-toe',
            description: 'Le classique jeu de morpion à deux joueurs.',
        },
    ];

    for (const game of games) {
        await prisma.game.upsert({
            where: { slug: game.slug },
            update: {},
            create: game,
        });
        console.log(`✅ Jeu upsert : ${game.name}`);
    }

    // Home content
    const homeContent = [
        { key: 'hero_title', value: 'Bienvenue sur GamePlatform' },
        { key: 'hero_subtitle', value: 'Affrontez vos amis en ligne sur nos jeux classiques.' },
        { key: 'hero_cta', value: 'Commencer à jouer' },
    ];

    for (const item of homeContent) {
        await prisma.homeContent.upsert({
            where: { key: item.key },
            update: {},
            create: item,
        });
        console.log(`✅ HomeContent upsert : ${item.key}`);
    }

    console.log('🎉 Seed terminé.');
}

main()
    .catch((e) => {
        console.error('❌ Erreur seed :', e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
