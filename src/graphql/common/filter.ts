import { Query } from 'elastic-ts';
import { Filter, Language } from '../../generated/graphql';
import { mapping } from '../../mapping';

export function getFilter(
    filters: Filter[] | null,
    language: Language | null,
    includeCollectionTags: boolean,
): Query[] {
    const result: Query[] = mapping.getStaticFilters();
    if (filters) {
        result.push(...mapFilters(filters, language, includeCollectionTags));
    }
    return result;
}

function mapFilters(
    filters: Filter[],
    language: Language | null,
    includeCollectionTags: boolean,
): Query[] {
    return filters
        .map((filter) => generateFilter(filter, language, includeCollectionTags))
        .filter((f): f is Query => f !== null);
}

function generateFilter(
    filter: Filter,
    language: Language | null,
    includeCollectionTags: boolean,
): Query | null {
    if (filter.facet) {
        return generateFacetFilter(
            mapping.facetFields[filter.facet],
            // Map terms that state labels to ids.
            mapping.mapFilterTerms(filter.facet, filter.terms || [], language),
            includeCollectionTags,
        );
    } else if (filter.simpleFilter) {
        return mapping.simpleFilters[filter.simpleFilter];
    } else {
        throw new Error('Please provide either `facet` or `simpleFilter` for each filter.');
    }
}

function generateFacetFilter(
    field: string,
    value: string[] | null,
    includeCollectionTags: boolean,
): Query | null {
    if (value === null || value.length === 0) {
        return null;
    }
    if (
        includeCollectionTags &&
        'collectionsFieldPrefix' in mapping &&
        !field.startsWith(mapping.collectionsFieldPrefix)
    ) {
        return {
            bool: {
                should: [
                    {
                        terms: {
                            [field]: value,
                        },
                    },
                    {
                        terms: {
                            [mapping.collectionsFieldPrefix + field]: value,
                        },
                    },
                ],
            },
        };
    }
    return {
        terms: {
            [field]: value,
        },
    };
}
