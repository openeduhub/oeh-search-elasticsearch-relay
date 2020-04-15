import { Request, Response } from 'express';
import { parseSearchParams, parseDetailsParams, parseAutoCompleteParams } from './parsers';
import { search } from './search';
import { details } from './details';
import { autoComplete } from './autoComplete';


export default [
    {
        path: '/api/v1/search',
        method: 'get',
        handler: [
            async ({ query }: Request, res: Response) => {
                const searchParams = parseSearchParams(query);
                const result = await search(searchParams);
                res.status(200).send(result);
            },
        ],
    },
    {
        path: '/api/v1/details/:id',
        method: 'get',
        handler: [
            async ({ params }: Request, res: Response) => {
                const id = parseDetailsParams(params);
                const result = await details(id);
                res.status(200).send(result);
            },
        ],
    },
    {
        path: '/api/v1/auto-complete',
        method: 'get',
        handler: [
            async ({ query }: Request, res: Response) => {
                const searchString = parseAutoCompleteParams(query);
                const result = await autoComplete(searchString);
                res.status(200).send(result);
            },
        ],
    },
];
