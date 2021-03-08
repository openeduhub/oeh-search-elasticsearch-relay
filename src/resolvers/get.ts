import { Args, Query, Resolver } from '@nestjs/graphql';
import { Hit, Language } from '..//graphql';
import { client } from '../common/elasticSearchClient';
import { mapping } from '../mapping';

@Resolver()
export class GetResolver {
    @Query()
    async get(@Args('id') id: string, @Args('language') language?: Language): Promise<Hit> {
        const { body } = await client.search({
            body: {
                query: mapping.getIdQuery(id),
                _source: mapping.getSources(),
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
