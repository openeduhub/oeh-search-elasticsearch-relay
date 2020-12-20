import { Query } from 'elastic-ts';
import { client } from '../../common/elasticSearchClient';
import { Filter, Language, QueryResolvers, SearchResult } from '../../generated/graphql';
import { mapping } from '../../mapping';
import { getFilter } from '../common/filter';
import { RequestBody } from '@elastic/elasticsearch/lib/Transport';

const searchResolver: QueryResolvers['search'] = async (
    root,
    args,
    context,
    info,
): Promise<SearchResult> => {
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
        _source: mapping.getSources(),
        track_total_hits: true,
        query,
    };
    // console.log('requestBody:', JSON.stringify(requestBody, null, 2));
    const { body } = await client.search({
        body: requestBody,
    });
    // console.log('hits: ', body.hits.total.value);
    return parseResponse(body, args.language ?? null);
};

export function generateSearchQuery(
    searchString: string | null,
    filters: Filter[] | null,
    language: Language | null,
    includeCollectionTags: boolean,
) {
    let must;
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

export function generateSearchStringQuery(searchString: string, language: Language | null): Query {
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

export default searchResolver;
