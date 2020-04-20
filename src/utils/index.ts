import { Router, Request, Response, NextFunction } from 'express';

type Wrapper = (router: Router) => void;

export const applyMiddleware = (
    middlewareWrappers: Wrapper[],
    router: Router,
) => {
    for (const wrapper of middlewareWrappers) {
        wrapper(router);
    }
};

type Handler = (
    req: Request,
    res: Response,
    next: NextFunction,
) => Promise<void> | void;

interface Route {
    path: string;
    method: string;
    handler: Handler | Handler[];
}
