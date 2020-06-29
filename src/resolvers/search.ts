import graphqlFields from 'graphql-fields';
import { client } from '../elasticSearchClient';
import { Filter, QueryResolvers, SearchResult } from '../generated/graphql';

const searchResolver: QueryResolvers['search'] = async (
    root,
    args,
    context,
    info,
): Promise<SearchResult> => {
    const fields = graphqlFields(info as any);
    const sources = getSourceFields(fields);
    const query = generateSearchQuery(args.searchString, args.filters || undefined);
    const { body } = await client.search({
        body: {
            from: args.from,
            size: 'hits' in fields ? args.size : 0,
            _source: {
                includes: sources,
            },
            query,
        },
    });
    return parseResponse(body, args.filters || undefined);
};

type GraphqlFields = {} | { [key: string]: GraphqlFields };

function getSourceFields(fields: GraphqlFields, qualifier?: string): string[] {
    if (typeof qualifier !== 'string') {
        if ('hits' in fields && 'hits' in fields.hits) {
            return getSourceFields(fields.hits.hits, '');
        } else {
            return [];
        }
    } else if (typeof fields === 'object' && Object.keys(fields).length === 0) {
        return [qualifier];
    }
    let result: string[] = [];
    for (const [key, value] of Object.entries(fields)) {
        result = result.concat(getSourceFields(value, qualifier ? `${qualifier}.${key}` : key));
    }
    return result;
}

export function generateSearchQuery(searchString?: string, filters: Filter[] = []) {
    let must;
    if (searchString) {
        must = generateSearchStringQuery(searchString);
    } else {
        must = { match_all: {} };
    }
    const filter = mapFilters(filters);
    const should = [
        {
            terms: {
                'collection.uuid': ['EDITORIAL', 'FEATURED'],
                boost: 1,
            },
        },
    ];
    return {
        bool: {
            must,
            filter,
            should,
        },
    };
}

export function generateSearchStringQuery(searchString: string) {
    return {
        multi_match: {
            query: searchString,
            type: 'cross_fields',
            fields: [
                'lom.general.title^3',
                'lom.general.keyword',
                'lom.general.description',
                'valuespaces.*.de',
                'valuespaces.*.en',
                'fulltext',
            ],
            operator: 'and',
        },
    };
}

export function mapFilters(filters: Filter[]): Array<object | null> {
    return filters.map((filter) => generateFilter(filter.field, filter.terms));
}

function generateFilter(field: string, value: string[] | null): object | null {
    if (value === null || value.length === 0) {
        return null;
    }
    return {
        terms: {
            [field]: value,
        },
    };
}

function parseResponse(body: any, filters?: Filter[]): SearchResult {
    return {
        took: body.took,
        hits: {
            hits: body.hits.hits.map((hit: any) => hit._source),
            total: body.hits.total,
        },
    };
}

export default searchResolver;
