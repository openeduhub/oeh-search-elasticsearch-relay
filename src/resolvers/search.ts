import graphqlFields from 'graphql-fields';
import {
    Aggregation,
    Bucket,
    Facet,
    Filter,
    QueryResolvers,
    SearchResult,
} from 'src/generated/graphql';
import { client } from '../elasticSearchClient';

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
        size: 20,
    },
    licenseOER: {
        field: 'license.oer',
        size: 20,
    },
    types: {
        field: 'type',
        size: 20,
    },
    keywords: {
        field: 'lom.general.keyword.keyword',
        size: 20,
    },
    disciplines: {
        field: 'valuespaces.discipline.de.keyword',
        size: 20,
    },
    learningResourceTypes: {
        field: 'valuespaces.learningResourceType.de.keyword',
        size: 20,
    },
    educationalContexts: {
        field: 'valuespaces.educationalContext.de.keyword',
        size: 20,
    },
    intendedEndUserRoles: {
        field: 'valuespaces.intendedEndUserRole.de.keyword',
        size: 20,
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
        body: {
            from: args.from,
            size: 'hits' in fields ? args.size : 0,
            _source: {
                includes: sources,
            },
            query: generateSearchQuery(args.searchString, args.filters || undefined),
            suggest:
                'didYouMeanSuggestion' in fields ? generateSuggest(args.searchString) : undefined,
            aggregations:
                'facets' in fields
                    ? generateAggregations(args.searchString, args.filters || undefined)
                    : undefined,
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

function generateSearchQuery(searchString?: string, filters: Filter[] = []) {
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

export function mapFilters(filters: Filter[]): Array<object | null> {
    return filters.map((filter) => generateFilter(filter.field, filter.terms));
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

function generateAggregations(searchString?: string, filters: Filter[] = []) {
    // Extract the non-facet part of the query to apply to all aggregations.
    const query = generateSearchQuery(searchString);
    // Build a modified aggregations object, where each facet is wrapped in a filter aggregation
    // that applies all active filters but that of the facet itself. This way, options are
    // narrowed down by other filters but currently not selected options of *this* facet are
    // still shown.
    const aggregations = Object.entries(aggregationTerms).reduce((acc, [label, terms]) => {
        const otherFilters = filters.filter((filter) => filter.field !== label);
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
                        include: getFilterTerms(filters, label) || [],
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

function getFilterTerms(filters: Filter[], field: string): string[] | undefined {
    const filter = filters.find((f) => f.field === field);
    return filter?.terms;
}

function parseResponse(body: any, filters?: Filter[]): SearchResult {
    return {
        took: body.took,
        hits: {
            hits: body.hits.hits.map((hit: any) => hit._source),
            total: body.hits.total.value,
        },
        didYouMeanSuggestion: getDidYouMeanSuggestion(body.suggest),
        facets: getFacets(body.aggregations, filters),
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

function getFacets(aggregations: any, filters?: Filter[]): Aggregation[] {
    if (!aggregations) {
        return [];
    }
    // Unwrap the filter structure introduced by `generateAggregations`.
    const facets = Object.entries<any>(aggregations.all_facets)
        .map(([key, value]) => {
            if (value[`filtered_${key}`]) {
                return {
                    facet: key as Facet,
                    buckets: mergeBucketLists(
                        value[`filtered_${key}`].buckets,
                        value[`selected_${key}`].buckets,
                        filters ? generateFilterBuckets(getFilterTerms(filters, key)) : null,
                    ),
                };
            }
            return (null as any) as Aggregation; // filter out below
        })
        .filter((entry) => entry !== null);
    return facets;
}

/**
 * Create a fake buckets list for applied filters.
 *
 * In case an applied filter has 0 hits, its aggregation will not be included by ElasticSearch.
 */
function generateFilterBuckets(filterTerms?: string[] | undefined) {
    if (filterTerms) {
        return filterTerms.map((s) => ({
            key: s,
            doc_count: 0,
        }));
    } else {
        return null;
    }
}

function mergeBucketLists(bucketList: Bucket[], ...others: Array<Bucket[] | null>): Bucket[] {
    if (others.length === 0) {
        return bucketList;
    }
    if (Array.isArray(others[0])) {
        for (const bucket of others[0]) {
            if (!bucketList.some((b) => b.key === bucket.key)) {
                bucketList.push(bucket);
            }
        }
    }
    return mergeBucketLists(bucketList, ...others.slice(1));
}

export default searchResolver;
