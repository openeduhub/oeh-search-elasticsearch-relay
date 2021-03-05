import { NextFunction, Request, Response, Router } from 'express';
import { GraphQLError } from 'graphql';
import { config } from '../../common/config';
import { logError } from '../../common/log';
import { ErrorResponse } from '../../rest/types/ErrorResponse';

function wrapRestError(router: Router) {
    router.use('/rest', (err: Error, req: Request, res: Response, next: NextFunction) => {
        logError(`${err.name} on ${req.path}: ${err.message}`);
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

export function logGraphQlError(error: GraphQLError) {
    console.log(error.originalError?.stack);
    logError(`${error.name} on ${error.path}: ${error.message}`);
}

export default [wrapRestError];
