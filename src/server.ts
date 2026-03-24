import 'dotenv/config';
import { createServer } from 'http';
import app from './app';
import { env } from './config/env';
import { initSockets } from './sockets';

const httpServer = createServer(app);

initSockets(httpServer);

httpServer.listen(env.PORT, () => {
    console.log(`Server running on port ${env.PORT} (${env.NODE_ENV})`);
});

export { httpServer };
