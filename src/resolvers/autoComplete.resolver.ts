import { getFilter } from '../common/filter';
import { client } from '../common/elasticSearchClient';
import { mapping } from '../mapping';
import { Args, Query, Resolver } from '@nestjs/graphql';
import { Filter, Language } from 'src/graphql';

const autoCompleteConfig = mapping.getAutoCompleteConfig();

@Resolver()
export class AutoCompleteResolvers {
    @Query()
    async autoComplete(
        @Args('searchString') searchString: string,
        @Args('filters') filters?: Filter[],
        @Args('language') language?: Language,
    ): Promise<string[]> {
        if (autoCompleteConfig === null) {
            return [];
        }
        const { body } = await client.search({
            body: {
                _source: autoCompleteConfig.source,
                query: {
                    bool: {
                        must: {
                            multi_match: {
                                query: searchString,
                                type: 'bool_prefix',
                                fields: autoCompleteConfig.queryFields,
                                operator: 'and',
                            },
                        },
                        must_not: mapping.getStaticNegativeFilters(),
                        filter: getFilter(filters ?? null, language ?? null, false),
                    },
                },
            },
        });
        return parseResponse(body);
    }
}

function parseResponse(body: any): string[] {
    return body.hits.hits.map((hit: any) => autoCompleteConfig?.mapHit(hit));
}
