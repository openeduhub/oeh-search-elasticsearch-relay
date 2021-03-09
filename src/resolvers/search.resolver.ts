import { RequestBody } from '@elastic/elasticsearch/lib/Transport';
import { Args, ArgsType, Info, Query } from '@nestjs/graphql';
import { Max } from 'class-validator';
import { Query as ElasticQuery } from 'elastic-ts';
import graphqlFields from 'graphql-fields';
import { client } from 'src/common/elasticSearchClient';
import { getFilter } from 'src/common/filter';
import { Filter, Language, SearchResult } from 'src/graphql';
import { mapping } from 'src/mapping';

@ArgsType()
class SearchArgs {
    @Max(100) size!: number;
    searchString?: string;
    language?: Language;
    filters?: Filter[];
    includeCollectionTags?: boolean;
    from?: number;
}

export class SearchResolver {
    @Query()
    async search(@Args() args: SearchArgs, @Info() info: any): Promise<SearchResult> {
        const fields = graphqlFields(info);
        const query = generateSearchQuery(
            args.searchString ?? null,
            args.filters ?? null,
            args.language ?? null,
            args.includeCollectionTags ?? false,
        );
        const requestBody: RequestBody = {
            from: args.from,
            size: args.size,
            stored_fields: mapping.getStoredFields(),
            _source: mapping.getSources(fields),
            track_total_hits: true,
            query,
        };
        // console.log('requestBody:', JSON.stringify(requestBody, null, 2));
        const { body } = await client.search({
            body: requestBody,
        });
        // console.log('hits: ', body.hits.total.value);
        return parseResponse(body, args.language ?? null);
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
