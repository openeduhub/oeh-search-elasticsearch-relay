import { Args, Query, Resolver } from '@nestjs/graphql';
import { Max } from 'class-validator';
import { client } from '../common/elasticSearchClient';
import { getFilter } from '../common/filter';
import { Aggregation, Bucket, Facet, Filter, Language } from '../graphql';
import { mapping } from '../mapping';
import { generateSearchStringQuery } from './search.resolver';

class FacetsArgs {
    facets!: Facet[];
    @Max(100) size!: number;
    searchString?: string;
    filters?: Filter[];
    language?: Language;
    skipOutputMapping?: boolean;
}

@Resolver()
export class FacetsResolver {
    @Query()
    async facets(@Args() args: FacetsArgs): Promise<Aggregation[]> {
        const requestBody = {
            body: {
                size: 0,
                aggregations: generateAggregations(
                    args.facets,
                    args.size,
                    args.language ?? null,
                    args.searchString ?? null,
                    args.filters ?? null,
                ),
            },
        };
        // console.log('requestBody:', JSON.stringify(requestBody, null, 4));
        const { body } = await client.search(requestBody);
        // console.log('response body:', JSON.stringify(body, null, 4));
        return getFacets(
            body.aggregations,
            args.filters ?? null,
            args.language ?? null,
            args.skipOutputMapping ?? false,
        );
    }
}

function generateAggregations(
    facets: Facet[],
    size: number,
    language: Language | null,
    searchString: string | null,
    filters: Filter[] | null,
) {
    // Extract the non-facet part of the query to apply to all aggregations.
    const must = searchString ? generateSearchStringQuery(searchString, language) : undefined;
    // Build a modified aggregations object, where each facet is wrapped in a filter aggregation
    // that applies all active filters but that of the facet itself. This way, options are
    // narrowed down by other filters but currently not selected options of *this* facet are
    // still shown.
    const aggregations = facets.reduce((acc, facet) => {
        const otherFilters = filters?.filter((filter) => filter.facet !== facet);
        acc[facet] = {
            filter: {
                bool: {
                    must,
                    must_not: [
                        ...mapping.getStaticNegativeFilters(),
                        {
                            match: { [mapping.facetFields[facet]]: '' },
                        },
                    ],
                    filter: getFilter(otherFilters ?? null, language, false),
                },
            },
            aggregations: generateFilteredAggregation(facet, size, language, filters),
        };
        return acc;
    }, {} as { [label in Facet]?: Record<string, unknown> });
    return aggregations;
}

function generateFilteredAggregation(
    facet: Facet,
    size: number,
    language: Language | null,
    filters: Filter[] | null,
) {
    const field = mapping.facetFields[facet];
    const terms = { field, size };
    const selectedTerms = (() => {
        if (filters) {
            const filterTerms = getFilterTerms(filters, facet);
            if (filterTerms) {
                return mapping.mapFilterTerms(facet, filterTerms, language);
            }
        }
        return null;
    })();
    const aggregations = {
        // Total number of buckets.
        [`${facet}_count`]: {
            cardinality: {
                field,
            },
        },
        // Will return the top entries with respect to currently active filters.
        [`filtered_${facet}`]: {
            terms,
        },
        // Will return the currently selected (filtered by) entries.
        //
        // This is important since the currently selected entries might not be among
        // the top results we get from the above aggregation. We explicitly add all
        // selected entries to make sure all active filters appear on the list.
        [`selected_${facet}`]: {
            terms: {
                ...terms,
                include: selectedTerms ?? [],
            },
        },
    };
    return aggregations;
}

function getFacets(
    aggregations: any,
    filters: Filter[] | null,
    language: Language | null,
    skipOutputMapping: boolean,
): Aggregation[] {
    // Unwrap the filter structure introduced by `generateAggregations`.
    const facets = Object.entries<any>(aggregations).map(([key, value]) => {
        const facet = key as Facet;
        const buckets = (() => {
            if (skipOutputMapping) {
                if (filters) {
                    throw new Error('Filters are not supported with `skipOutputMapping`');
                }
                return value[`filtered_${facet}`].buckets;
            } else {
                return mergeBucketLists(
                    mapping.mapFacetBuckets(facet, value[`filtered_${facet}`].buckets, language),
                    mapping.mapFacetBuckets(facet, value[`selected_${facet}`].buckets, language),
                    filters ? generateFilterBuckets(getFilterTerms(filters, facet)) : null,
                );
            }
        })();
        return {
            buckets,
            facet,
            total_buckets: value[`${facet}_count`].value,
        };
    });
    return facets;
}

export function getFilterTerms(filters: Filter[], facet: Facet): string[] | null {
    const filter = filters.find((f) => f.facet === facet);
    return filter?.terms ?? null;
}

/**
 * Create a fake buckets list for applied filters.
 *
 * In case an applied filter has 0 hits, its aggregation will not be included by ElasticSearch.
 */
function generateFilterBuckets(filterTerms: string[] | null) {
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
