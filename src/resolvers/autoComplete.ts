import { QueryResolvers } from 'src/generated/graphql';
import { client, index } from '../elasticSearchClient';

const autoCompleteResolver: QueryResolvers['autoComplete'] = async (
    root,
    args,
    context,
    info,
): Promise<string[]> => {
    const { body } = await client.search({
        index,
        body: {
            query: {
                multi_match: {
                    query: args.searchString,
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
};

function parseResponse(body: any): string[] {
    return body.hits.hits.map((hit: any) => hit._source.lom.general.title);
}

export default autoCompleteResolver;
