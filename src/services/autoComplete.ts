import { client, index } from './config';

export async function autoComplete(searchString: string): Promise<string[]> {
    const { body } = await client.search({
        index,
        body: {
            query: {
                multi_match: {
                    query: searchString,
                    type: 'bool_prefix',
                    fields: [
                        'lom.general.title.search_as_you_type',
                        'lom.general.title.search_as_you_type._2gram',
                        'lom.general.title.search_as_you_type._3gram',
                        'lom.general.title.search_as_you_type._index_prefix',
                    ],
                    operator: 'and',
                },
            },
        },
    });
    return parseResponse(body);
}

function parseResponse(body: any): string[] {
    return body.hits.hits.map((hit: any) => hit._source.lom.general.title);
}
