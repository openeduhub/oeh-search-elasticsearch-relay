import { Query } from 'elastic-ts';
import { Bucket, Facet, Hit, Language, SimpleFilter } from '../graphql';

export type MapFilterTerms = (facet: Facet, terms: string[], language: Language | null) => string[];
export type MapFacetBuckets = (
    facet: Facet,
    buckets: Bucket[],
    language: Language | null,
) => Bucket[];

export interface Mapping<Source> {
    facetFields: { [facet in Facet]: string };
    simpleFilters: { [key in SimpleFilter]: Query };
    collectionsFieldPrefix?: string;
    mapFilterTerms: MapFilterTerms;
    mapFacetBuckets: MapFacetBuckets;
    mapHit(source: Source, language: Language | null): Hit;
    getIdQuery(id: string): { term: any };
    getSources(fields: any): { includes?: string[]; excludes?: string[] };
    getStoredFields(): string[];
    getSearchQueryFields(language: Language | null): string[];
    getShouldTerms(): { boost: number; [field: string]: string[] | number };
    getAutoCompleteConfig(): {
        source: { includes?: string[]; excludes?: string[] };
        mapHit: (hit: Source) => string;
        queryFields: string[];
    } | null;
    getDidYouMeanSuggestionField(): string;
    getStaticFilters(): Query[];
    getStaticNegativeFilters(): Query[];
    getInternationalizedFacetFields(facet: Facet, language: Language): string[] | null;
}
