import graphqlFields from 'graphql-fields';
import { client } from '../elasticSearchClient';
import { Bucket, Facet, Facets, Filter, Language, QueryResolvers } from '../generated/graphql';
import { generateSearchStringQuery, mapFilters } from './search';

interface AggregationTerms {
    field: string;
    size: number;
}

export const knownFacets: { [facet in Facet]: (language?: Language) => string } = {
    sources: () => 'source.name.keyword',
    licenseOER: () => 'license.oer',
    types: () => 'type',
    keywords: () => 'lom.general.keyword.keyword',
    disciplines: (lang) => `valuespaces.discipline.${lang || 'key'}.keyword`,
    learningResourceTypes: (lang) => `valuespaces.learningResourceType.${lang || 'key'}.keyword`,
    educationalContexts: (lang) => `valuespaces.educationalContext.${lang || 'key'}.keyword`,
    intendedEndUserRoles: (lang) => `valuespaces.intendedEndUserRole.${lang || 'key'}.keyword`,
    collections: () => 'collection.uuid',
};

const facetsResolver: QueryResolvers['facets'] = async (
    root,
    args,
    context,
    info,
): Promise<Facets> => {
    const fields = graphqlFields(info as any);
    const facets = Object.keys(fields).filter((field): field is Facet => field in knownFacets);
    const { body } = await client.search({
        body: {
            size: 0,
            aggregations: generateAggregations(
                facets,
                args.size,
                args.language || undefined,
                args.searchString || undefined,
                args.filters || undefined,
            ),
        },
    });
    return getFacets(body.aggregations, args.filters || undefined, args.language || undefined);
};

function generateAggregations(
    facets: Facet[],
    size: number,
    language?: Language,
    searchString?: string,
    filters: Filter[] = [],
) {
    // Extract the non-facet part of the query to apply to all aggregations.
    const must = searchString ? generateSearchStringQuery(searchString) : undefined;
    // Build a modified aggregations object, where each facet is wrapped in a filter aggregation
    // that applies all active filters but that of the facet itself. This way, options are
    // narrowed down by other filters but currently not selected options of *this* facet are
    // still shown.
    const aggregations = facets.reduce((acc, facet) => {
        const otherFilters = filters.filter(
            (filter) => filter.field !== knownFacets[facet](language),
        );
        const terms = getAggregationTerms(facet, size, language);
        const filteredAggregation = {
            filter: {
                bool: {
                    must,
                    filter: mapFilters(otherFilters),
                },
            },
            aggregations: {
                [`filtered_${facet}`]: {
                    // Will return the top entries with respect to currently active filters.
                    terms,
                },
                [`selected_${facet}`]: {
                    // Will return the currently selected (filtered by) entries.
                    //
                    // This is important since the currently selected entries might not be among
                    // the top results we get from the above aggregation. We explicitly add all
                    // selected entries to make sure all active filters appear on the list.
                    terms: {
                        ...terms,
                        include: getFilterTerms(filters, facet) || [],
                    },
                },
            },
        };
        acc[facet as Facet] = filteredAggregation;
        return acc;
    }, {} as { [label in Facet]?: object });
    return aggregations;
}

function getAggregationTerms(facet: Facet, size: number, language?: Language): AggregationTerms {
    return {
        field: knownFacets[facet](language),
        size,
    };
}

function getFacets(aggregations: any, filters?: Filter[], language?: Language): Facets {
    // Unwrap the filter structure introduced by `generateAggregations`.
    const facets = Object.entries<any>(aggregations)
        .filter(([key, value]) => key in knownFacets)
        .reduce((acc, [key, value]) => {
            const facet = key as Facet;
            const field = knownFacets[facet](language);
            if (value[`filtered_${key}`]) {
                acc[facet] = {
                    buckets: mergeBucketLists(
                        value[`filtered_${facet}`].buckets,
                        value[`selected_${facet}`].buckets,
                        filters ? generateFilterBuckets(getFilterTerms(filters, field)) : null,
                    ),
                    field,
                };
            }
            return acc;
        }, {} as Facets);
    return facets;
}

function getFilterTerms(filters: Filter[], field: string): string[] | undefined {
    const filter = filters.find((f) => f.field === field);
    return filter?.terms;
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

export default facetsResolver;
