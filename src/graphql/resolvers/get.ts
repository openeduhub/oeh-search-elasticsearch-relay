import { Hit, QueryResolvers, Language } from '../../generated/graphql';
import { client } from '../../common/elasticSearchClient';
import { mapping } from '../../mapping';

const getResolver: QueryResolvers['get'] = async (root, args, context, info): Promise<Hit> => {
    const { body } = await client.search({
        body: {
            query: mapping.getIdQuery(args.id),
        },
    });
    return parseResponse(body, args.language ?? null);
};

function parseResponse(body: any, language: Language | null): Hit {
    if (body.hits.total.value !== 1) {
        throw new Error(`Got ${body.hits.total.value} results when requesting entry by id`);
    }
    return mapping.mapHit(body.hits.hits[0]._source, language);
}

export default getResolver;
