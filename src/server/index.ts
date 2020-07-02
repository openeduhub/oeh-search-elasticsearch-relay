import express from 'express';
import http from 'http';
import { config } from '../common/config';
import { RegisterRoutes } from '../generated/routes';
import middleware from './middleware';
import errorHandlers from './middleware/errorHandlers';
import { applyMiddleware } from './utils';

process.on('uncaughtException', (e) => {
    console.log(e);
    process.exit(1);
});

process.on('unhandledRejection', (e) => {
    console.log(e);
    process.exit(1);
});

process.on('SIGINT', () => {
    process.exit();
});

export function start() {
    const router = express();
    applyMiddleware(middleware, router);
    RegisterRoutes(router);
    applyMiddleware(errorHandlers, router);
    const port = config.port;
    const server = http.createServer(router);
    server.listen(port, () => console.log(`Server is running on http://localhost:${port}...`));
}
