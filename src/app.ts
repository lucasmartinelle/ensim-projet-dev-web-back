import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import { router } from './routes';
import { errorMiddleware } from './middlewares/error.middleware';
import { swaggerSpec } from './config/swagger';

const app = express();

// Swagger UI — CSP assouplie uniquement pour /api/docs
app.use(
    '/api/docs',
    helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'", "'unsafe-inline'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                imgSrc: ["'self'", 'data:', 'https:'],
                connectSrc: ["'self'"],
            },
        },
    }),
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
        customSiteTitle: 'GamePlatform API Docs',
        swaggerOptions: {
            persistAuthorization: true, // conserve le token entre les rechargements
        },
    }),
);

// Middlewares globaux
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Spec OpenAPI brute (JSON) — utile pour les outils tiers
app.get('/api/docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
});

// Fichiers statiques (covers uploadées)
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Routes
app.use('/api', router);

// Gestion des erreurs (toujours en dernier)
app.use(errorMiddleware);

export default app;
