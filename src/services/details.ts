import { Result } from 'shared/types';
import { client, index } from './config';

export async function details(id: string): Promise<Result> {
    const { body } = await client.search({
        index,
        body: {
            query: { term: { _id: id } },
        },
    });
    return parseResponse(body);
}

function parseResponse(body: any): Result {
    if (body.hits.total.value !== 1) {
        throw new Error(`Got ${body.hits.total.value} results when requesting entry by id`);
    }
    return body.hits.hits[0]._source;
}
