import { Bucket, Facet, Facets, SearchResponse } from 'shared/types';
import { client, index } from './config';
import { SearchParams } from './parsers';

export type Filters = {
    [label in Facet]?: string[] | null;
};

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

export async function search({
    searchString,
    pageIndex = 0,
    pageSize = 10,
    filters = {},
}: SearchParams): Promise<SearchResponse> {
    const { body } = await client.search({
        index,
        body: {
            from: pageIndex * pageSize,
            size: pageSize,
            _source: {
                excludes: ['thumbnail.large'],
            },
            query: generateSearchQuery(searchString, filters),
            suggest: generateSuggest(searchString),
            aggregations: generateAggregations(searchString, filters),
        },
    });
    return parseResponse(body);
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

function mapFilters(filters: Filters): Array<object | null> {
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
    const aggregations = Object.entries(aggregationTerms).reduce(
        (acc, [label, terms]) => {
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
        },
        {} as { [label in Facet]?: object },
    );
    return {
        all_facets: {
            global: {},
            aggregations,
        },
    };
}

function parseResponse(body: any) {
    return {
        searchResults: {
            total: body.hits.total.value,
            time: body.took,
            results: body.hits.hits.map((hit: any) => hit._source),
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
                .map((word) =>
                    word.changed ? `<em>${word.text}</em>` : word.text,
                )
                .join(' '),
        };
    } else {
        return null;
    }
}

function getFacets(aggregations: any) {
    // Unwrap the filter structure introduced by `generateAggregations`.
    const facets = Object.entries<any>(aggregations.all_facets).reduce(
        (acc, [label, aggregation]) => {
            if (aggregation[`filtered_${label}`]) {
                acc[label as Facet] = mergeAggregations(
                    aggregation[`filtered_${label}`],
                    aggregation[`selected_${label}`],
                );
            }
            return acc;
        },
        {} as Facets,
    );
    return facets;
}

function mergeAggregations(
    lhs: { buckets: Bucket[] },
    rhs: { buckets: Bucket[] },
): { buckets: Bucket[] } {
    // There are actually more fields in aggregations than `buckets`, but we don't use them at the
    // moment, so we just drop them.
    return { buckets: mergeBuckets(lhs.buckets, rhs.buckets) };
}

function mergeBuckets(lhs: Bucket[], rhs: Bucket[]): Bucket[] {
    for (const bucket of rhs) {
        if (!lhs.some((b) => b.key === bucket.key)) {
            lhs.push(bucket);
        }
    }
    return lhs;
}
