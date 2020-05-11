export class BadRequestError extends Error {
    public readonly status = 400;
}

export class NotFoundError extends Error {
    public readonly status = 404;
}
