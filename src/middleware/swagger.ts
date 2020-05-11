import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';
import swaggerDocument from '../generated/swagger.json';

export const handleSwagger = (router: Router) =>
    router.use('/swagger', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
