import { Filter, Language } from '../../generated/graphql';
import { mapping } from '../../mapping';

export function getFilter(filters: Filter[] | null, language: Language | null): Array<any | null> {
    const result: Array<any | null> = mapping.getStaticFilters();
    if (filters) {
        result.push(...mapFilters(filters, language));
    }
    return result;
}

function mapFilters(filters: Filter[], language: Language | null): Array<object | null> {
    return filters.map((filter) =>
        generateFilter(
            mapping.facetFields[filter.facet],
            // Map terms that state labels to ids.
            mapping.mapFilterTerms(filter.facet, filter.terms, language),
        ),
    );
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
