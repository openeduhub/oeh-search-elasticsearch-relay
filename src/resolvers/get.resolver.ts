import { HttpException, HttpStatus } from '@nestjs/common';
import { Args, Context, Info, Query, Resolver } from '@nestjs/graphql';
import graphqlFields from 'graphql-fields';
import { warn } from '../common/utils';
import { client } from '../common/elasticSearchClient';
import { Hit, Language } from '../graphql';
import { mapping } from '../mapping';

@Resolver()
export class GetResolver {
    @Query()
    async get(
        @Context() context: any,
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
        context.rootResponseBody = body;
        return parseResponse(body, id, language ?? null);
    }
}

function parseResponse(body: any, id: string, language: Language | null): Hit {
    if (body.hits.total.value === 0) {
        throw new HttpException('Not Found', HttpStatus.NOT_FOUND);
    } else if (body.hits.total.value > 1) {
        warn(`Got ${body.hits.total.value} results when requesting entry by id: ${id}`);
    }
    return mapping.mapHit(body.hits.hits[0], language);
}
