import { Args, Info, Query, Resolver } from '@nestjs/graphql';
import graphqlFields from 'graphql-fields';
import { Hit, Language } from '../graphql';
import { client } from '../common/elasticSearchClient';
import { mapping } from '../mapping';

@Resolver()
export class GetResolver {
    @Query()
    async get(
        @Info() info: any,
        @Args('id') id: string,
        @Args('language') language?: Language,
    ): Promise<Hit> {
        const fields = graphqlFields(info);
        const { body } = await client.search({
            body: {
                query: mapping.getIdQuery(id),
                _source: mapping.getSources(fields),
                stored_fields: mapping.getStoredFields(),
            },
        });
        return parseResponse(body, language ?? null);
    }
}

function parseResponse(body: any, language: Language | null): Hit {
    if (body.hits.total.value !== 1) {
        throw new Error(`Got ${body.hits.total.value} results when requesting entry by id`);
    }
    return mapping.mapHit(body.hits.hits[0], language);
}
