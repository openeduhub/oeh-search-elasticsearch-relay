import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';
import { config } from '../config';
import swaggerDocument from '../generated/swagger.json';

if (config.url) {
    swaggerDocument.servers.forEach((server) => (server.url = config.url + server.url));
}

export const handleSwagger = (router: Router) =>
    router.use('/swagger', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
