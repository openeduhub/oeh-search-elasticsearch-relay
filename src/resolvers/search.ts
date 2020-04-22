import graphqlFields from 'graphql-fields';
import {
    Aggregation,
    Bucket,
    Facet,
    Filters,
    QueryResolvers,
    SearchResult,
} from 'src/generated/graphql';
import { client, index } from '../elasticSearchClient';

interface AggregationTerms {
    field: string;
    size: number;
}

interface Suggest {
    text: string;
    offset: number;
    length: number;
    options: SuggestOption[];
}

interface SuggestOption {
    text: string;
    score: number;
    freq: number;
}

const aggregationTerms: { [label: string]: AggregationTerms } = {
    sources: {
        field: 'source.name.keyword',
        size: 100,
    },
    keywords: {
        field: 'lom.general.keyword.keyword',
        size: 100,
    },
    disciplines: {
        field: 'valuespaces.discipline.de.keyword',
        size: 100,
    },
    learningResourceTypes: {
        field: 'valuespaces.learningResourceType.de.keyword',
        size: 100,
    },
    educationalContexts: {
        field: 'valuespaces.educationalContext.de.keyword',
        size: 100,
    },
};

const searchResolver: QueryResolvers['search'] = async (
    root,
    args,
    context,
    info,
): Promise<SearchResult> => {
    const fields = graphqlFields(info as any);
    const sources = getSourceFields(fields);
    const { body } = await client.search({
        index,
        body: {
            from: args.from,
            size: args.size,
            _source: {
                includes: sources,
            },
            query: generateSearchQuery(args.searchString, args.filters),
            suggest:
                'didYouMeanSuggestion' in fields ? generateSuggest(args.searchString) : undefined,
            aggregations:
                'facets' in fields
                    ? generateAggregations(args.searchString, args.filters)
                    : undefined,
        },
    });
    return parseResponse(body);
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

function generateSearchQuery(searchString?: string, filters: Filters = {}) {
    return {
        bool: {
            must: searchString
                ? {
                      multi_match: {
                          query: searchString,
                          type: 'cross_fields',
                          fields: [
                              'lom.general.title^3',
                              'lom.general.keyword',
                              'lom.educational.description',
                              'valuespaces.*.de',
                              'fulltext',
                          ],
                          operator: 'and',
                      },
                  }
                : undefined,
            filter: mapFilters(filters),
        },
    };
}

export function mapFilters(filters: Filters): Array<object | null> {
    return Object.entries(filters)
        .map(([label, value]) => generateFilter(label as Facet, value || null))
        .filter((entry) => entry !== null);
}

function generateFilter(label: Facet, value: string[] | null): object | null {
    if (value === null || value.length === 0) {
        return null;
    }
    const terms = aggregationTerms[label];
    if (terms && 'field' in terms) {
        return {
            terms: {
                [terms.field]: value,
            },
        };
    } else {
        throw new Error(`Unknown filter label: ${label}`);
    }
}

function generateSuggest(searchString?: string) {
    if (searchString) {
        return {
            text: searchString,
            title: {
                term: {
                    field: 'lom.general.title',
                },
            },
        };
    } else {
        return undefined;
    }
}

function generateAggregations(searchString?: string, filters: Filters = {}) {
    // Extract the non-facet part of the query to apply to all aggregations.
    const query = generateSearchQuery(searchString, {});
    // Build a modified aggregations object, where each facet is wrapped in a filter aggregation
    // that applies all active filters but that of the facet itself. This way, options are
    // narrowed down by other filters but currently not selected options of *this* facet are
    // still shown.
    const aggregations = Object.entries(aggregationTerms).reduce((acc, [label, terms]) => {
        const otherFilters = { ...filters };
        delete otherFilters[label as Facet];
        const filteredAggregation = {
            filter: {
                bool: {
                    must: query.bool.must,
                    filter: mapFilters(otherFilters),
                },
            },
            aggregations: {
                [`filtered_${label}`]: {
                    // Will return the top entries with respect to currently active filters.
                    terms,
                },
                [`selected_${label}`]: {
                    // Will return the currently selected (filtered by) entries.
                    //
                    // This is important since the currently selected entries might not be among
                    // the top results we get from the above aggregation. We explicitly add all
                    // selected entries to make sure all active filters appear on the list.
                    terms: {
                        ...terms,
                        include: filters[label as Facet] || [],
                    },
                },
            },
        };
        acc[label as Facet] = filteredAggregation;
        return acc;
    }, {} as { [label in Facet]?: object });
    return {
        all_facets: {
            global: {},
            aggregations,
        },
    };
}

function parseResponse(body: any): SearchResult {
    return {
        took: body.took,
        hits: {
            hits: body.hits.hits.map((hit: any) => hit._source),
            total: body.hits.total.value,
        },
        didYouMeanSuggestion: getDidYouMeanSuggestion(body.suggest),
        facets: getFacets(body.aggregations),
    };
}

function getDidYouMeanSuggestion(suggest?: { [label: string]: any }) {
    // TODO: consider suggestions for multiple fields
    if (suggest) {
        const didYouMeanSuggestion = processDidYouMeanSuggestion(suggest.title);
        return didYouMeanSuggestion;
    } else {
        return null;
    }
}

function processDidYouMeanSuggestion(suggests: Suggest[]) {
    const words = suggests.map((suggest) => {
        if (suggest.options.length > 0) {
            return { text: suggest.options[0].text, changed: true };
        } else {
            return { text: suggest.text, changed: false };
        }
    });
    if (words.some((word) => word.changed)) {
        return {
            plain: words.map((word) => word.text).join(' '),
            html: words
                .map((word) => (word.changed ? `<em>${word.text}</em>` : word.text))
                .join(' '),
        };
    } else {
        return null;
    }
}

function getFacets(aggregations: any): Aggregation[] {
    if (!aggregations) {
        return [];
    }
    // Unwrap the filter structure introduced by `generateAggregations`.
    const facets = Object.entries<any>(aggregations.all_facets)
        .map(([key, value]) => {
            if (value[`filtered_${key}`]) {
                return {
                    facet: key as Facet,
                    buckets: mergeBuckets(
                        value[`filtered_${key}`].buckets,
                        value[`selected_${key}`].buckets,
                    ),
                };
            }
            return (null as any) as Aggregation; // filter out below
        })
        .filter((entry) => entry !== null);
    return facets;
}

function mergeBuckets(lhs: Bucket[], rhs: Bucket[]): Bucket[] {
    for (const bucket of rhs) {
        if (!lhs.some((b) => b.key === bucket.key)) {
            lhs.push(bucket);
        }
    }
    return lhs;
}

export default searchResolver;
