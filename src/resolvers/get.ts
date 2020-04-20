import { Hit, QueryResolvers } from 'src/generated/graphql';
import { client, index } from '../elasticSearchClient';

const getResolver: QueryResolvers['get'] = async (root, args, context, info): Promise<Hit> => {
    const { body } = await client.search({
        index,
        body: {
            query: { term: { _id: args.id } },
        },
    });
    return parseResponse(body);
};

function parseResponse(body: any): Hit {
    if (body.hits.total.value !== 1) {
        throw new Error(`Got ${body.hits.total.value} results when requesting entry by id`);
    }
    return body.hits.hits[0]._source;
}

export default getResolver;
