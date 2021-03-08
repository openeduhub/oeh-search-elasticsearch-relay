import { RequestBody } from '@elastic/elasticsearch/lib/Transport';
import { Args, Query, Resolver } from '@nestjs/graphql';
import { Query as ElasticQuery } from 'elastic-ts';
import { client } from 'src/common/elasticSearchClient';
import { getFilter } from 'src/common/filter';
import { Filter, Language, SearchResult } from 'src/graphql';
import { mapping } from 'src/mapping';

@Resolver()
export class SearchResolver {
    @Query()
    async search(
        @Args('size') size: number,
        @Args('searchString') searchString?: string,
        @Args('language') language?: Language,
        @Args('filters') filters?: Filter[],
        @Args('includeCollectionTags') includeCollectionTags?: boolean,
        @Args('from') from?: number,
    ): Promise<SearchResult> {
        const query = generateSearchQuery(
            searchString ?? null,
            filters ?? null,
            language ?? null,
            includeCollectionTags ?? false,
        );
        const requestBody: RequestBody = {
            from: from,
            size: size,
            stored_fields: mapping.getStoredFields(),
            _source: mapping.getSources(),
            track_total_hits: true,
            query,
        };
        // console.log('requestBody:', JSON.stringify(requestBody, null, 2));
        const { body } = await client.search({
            body: requestBody,
        });
        // console.log('hits: ', body.hits.total.value);
        return parseResponse(body, language ?? null);
    }
}

export function generateSearchQuery(
    searchString: string | null,
    filters: Filter[] | null,
    language: Language | null,
    includeCollectionTags: boolean,
) {
    let must: ElasticQuery;
    if (searchString === null || searchString === '') {
        must = { match_all: {} };
    } else {
        must = generateSearchStringQuery(searchString, language);
    }
    const filter = getFilter(filters ?? null, language, includeCollectionTags);
    const should = [{ terms: mapping.getShouldTerms() }];
    return {
        bool: {
            must,
            must_not: mapping.getStaticNegativeFilters(),
            filter,
            should,
        },
    };
}

export function generateSearchStringQuery(
    searchString: string,
    language: Language | null,
): ElasticQuery {
    return {
        multi_match: {
            query: searchString,
            type: 'cross_fields',
            fields: mapping.getSearchQueryFields(language),
            operator: 'and',
        },
    };
}

function parseResponse(body: any, language: Language | null): SearchResult {
    return {
        took: body.took,
        total: body.hits.total,
        hits: body.hits.hits.map((hit: any) => mapping.mapHit(hit, language)),
    };
}
