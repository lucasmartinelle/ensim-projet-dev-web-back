import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { router } from './routes';
import { errorMiddleware } from './middlewares/error.middleware';

const app = express();

// Middlewares globaux
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api', router);

// Gestion des erreurs (toujours en dernier)
app.use(errorMiddleware);

export default app;