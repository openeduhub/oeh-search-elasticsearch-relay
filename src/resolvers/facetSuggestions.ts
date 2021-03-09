import { Args, Query, Resolver } from '@nestjs/graphql';
import { Max } from 'class-validator';
import * as Elastic from 'elastic-ts';
import { client } from '../common/elasticSearchClient';
import { getFilter } from '../common/filter';
import { Aggregation, Bucket, Facet, Filter, Language } from '../graphql';
import { mapping } from '../mapping';
import { generateSearchStringQuery } from './search.resolver';

class FacetSuggestionsArgs {
    facets!: Facet[];
    @Max(100) size!: number;
    language!: Language;
    inputString?: string;
    searchString?: string;
    filters?: Filter[];
}

@Resolver()
export class FacetSuggestionsResolver {
    @Query()
    async facetSuggestions(@Args() args: FacetSuggestionsArgs): Promise<Aggregation[]> {
        const requestBody = {
            body: {
                size: 0,
                aggregations: generateAggregations(
                    args.inputString ?? '',
                    args.facets,
                    args.size,
                    args.language,
                    args.searchString ?? null,
                    args.filters ?? null,
                ),
            },
        };
        // console.log('requestBody:', JSON.stringify(requestBody, null, 4));
        const { body } = await client.search(requestBody);
        // console.log('response body:', JSON.stringify(body, null, 4));
        return getFacets(body.aggregations, args.language, args.filters ?? null, args.size);
    }
}

function generateAggregations(
    inputString: string,
    facets: Facet[],
    size: number,
    language: Language,
    searchString: string | null,
    filters: Filter[] | null,
) {
    const searchQuery = searchString ? [generateSearchStringQuery(searchString, language)] : [];
    const aggregations: Elastic.Aggregations = facets.reduce((acc, facet) => {
        const otherFilters = filters?.filter((f) => f.facet !== facet);
        const filter = [...getFilter(otherFilters ?? null, language, false), ...searchQuery];
        acc[facet] = {
            filter: {
                bool: {
                    must: inputString
                        ? getFacetAsYouTypeQuery(facet, language, inputString)
                        : undefined,
                    must_not: mapping.getStaticNegativeFilters(),
                    filter,
                },
            },
            aggregations: generateFilteredAggregation(facet, size, filters),
        };
        return acc;
    }, {} as Elastic.Aggregations);
    return aggregations;
}

function getFacetAsYouTypeQuery(
    facet: Facet,
    language: Language,
    asYouTypeString: string,
): Elastic.Query {
    const fields = mapping.getInternationalizedFacetFields(facet, language);
    if (fields === null) {
        throw new Error(`As-you-type suggestions are not available for facet ${facet}`);
    }
    return {
        multi_match: {
            query: asYouTypeString,
            type: 'bool_prefix' as Elastic.MultiMatchQuery['multi_match']['type'],
            fields,
            operator: 'and',
        },
    };
}

function generateFilteredAggregation(
    facet: Facet,
    size: number,
    filters: Filter[] | null,
): Elastic.Aggregations {
    // If we already filter for terms of a facet, we request that many more terms, so we can later
    // filter out the ones that are already part of the active filter.
    const numberOfActiveFilterTerms =
        filters?.find((filter) => filter.facet === facet)?.terms?.length ?? 0;
    size += numberOfActiveFilterTerms;
    const field = mapping.facetFields[facet];
    const terms = { field, size };
    const aggregations = {
        // Will return the top entries with respect to currently active filters.
        [`filtered_${facet}`]: {
            terms,
        },
        [`${facet}_count`]: {
            cardinality: {
                field,
            },
        },
    };
    return aggregations;
}

function getFacets(
    aggregations: any,
    language: Language | null,
    filters: Filter[] | null,
    size: number,
): Aggregation[] {
    // Unwrap the filter structure introduced by `generateAggregations`.
    const facets = Object.entries<any>(aggregations).map(([key, value]) => {
        const facet = key as Facet;
        let buckets = mapping.mapFacetBuckets(facet, value[`filtered_${facet}`].buckets, language);
        // Remove already active filters from suggested terms.
        const activeFacetFilters = filters?.find((filter) => filter.facet === facet);
        if (activeFacetFilters) {
            buckets = buckets
                .filter((bucket: Bucket) => !activeFacetFilters.terms?.includes(bucket.key))
                .slice(0, size);
        }
        return {
            buckets,
            facet,
            total_buckets: value[`${facet}_count`].value,
        };
    });
    return facets;
}
