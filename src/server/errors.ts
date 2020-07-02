export class BadRequestError extends Error {
    readonly status = 400;
}

export class NotFoundError extends Error {
    readonly status = 404;
}
