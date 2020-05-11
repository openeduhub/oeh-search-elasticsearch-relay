import { Request, Response, NextFunction, Router } from 'express';
import { config } from '../config';
import { ErrorResponse } from '../types/ErrorResponse';

function wrapRestError(router: Router) {
    router.use('/rest', (err: Error, req: Request, res: Response, next: NextFunction) => {
        console.error(err);
        const message: ErrorResponse = {
            error: err.name,
            message: err.message,
            logLevel: config.production ? 'production' : 'debug',
            stacktraceArray: config.production
                ? ['Stacktrace is not available in production environment.']
                : err.stack?.split('\n').map((s) => s.trim()) || [],
        };
        const status = (err as any).status || 500;
        res.status(status).send(message);
    });
}

export default [wrapRestError];
