import { Facet, Language, Bucket } from '../../graphql';
import { vocabsSchemes, VocabsScheme, vocabs } from '../../common/vocabs';
import {
    CustomTermsMapper,
    getCustomTermsMapper,
    CustomTermsMap,
    CustomTermsMaps,
} from './CustomTermsMap';
import { warn } from '../../common/utils';

type CustomTermsMappers<T extends Facet> = {
    [facet in T]: CustomTermsMapper;
};

export class CommonMapper<T extends Facet> {
    private readonly customTermsMappers: CustomTermsMappers<T>;

    constructor(customTermsMaps: CustomTermsMaps) {
        this.customTermsMappers = this.generateCustomTermsMappers(customTermsMaps);
    }

    map(facet: Facet | VocabsScheme, value: string, language: Language | null): string {
        if (facet in this.customTermsMappers) {
            return this.mapCustomField(facet as T, value);
        } else if (facet in vocabsSchemes) {
            return this.mapVocabsField(facet as VocabsScheme, value, language);
        } else {
            return value;
        }
    }

    mapArray(facet: Facet, values: string[], language: Language | null): string[] {
        const result = values.map((value) => this.map(facet, value, language));
        return removeDuplicates(result);
    }

    mapFilterTerms(facet: Facet, terms: string[], language: Language | null) {
        if (facet in this.customTermsMappers) {
            return this.mapCustomFilterTerms(facet as T, terms);
        } else if (facet in vocabsSchemes) {
            return this.mapVocabsFilterTerms(facet as VocabsScheme, terms, language);
        } else {
            return terms;
        }
    }

    mapFacetBuckets(facet: Facet, buckets: Bucket[], language: Language | null): Bucket[] {
        if (facet in this.customTermsMappers) {
            return this.mapCustomFacetBuckets(facet as T, buckets);
        } else if (facet in vocabsSchemes) {
            return this.mapVocabsFacetBuckets(facet as VocabsScheme, buckets, language);
        } else {
            return buckets;
        }
    }

    private generateCustomTermsMappers(customTermsMaps: CustomTermsMaps) {
        return Object.entries(customTermsMaps).reduce((acc, [facet, map]) => {
            acc[facet as T] = getCustomTermsMapper(map as CustomTermsMap);
            return acc;
        }, {} as CustomTermsMappers<T>);
    }

    private mapCustomField(facet: T, value: string) {
        const mapper = this.customTermsMappers[facet];
        if (value in mapper.getReverseMap()) {
            return mapper.getReverseMap()[value];
        } else {
            warn(`Unknown value for facet ${facet}: ${value}`);
            return value;
        }
    }

    private mapVocabsField(
        vocabsScheme: VocabsScheme,
        value: string,
        language: Language | null,
    ): string {
        if (language !== null) {
            return vocabs.getLabel(vocabsScheme, value, language);
        } else {
            return value;
        }
    }

    private mapCustomFilterTerms(facet: T, terms: string[]) {
        const mapper = this.customTermsMappers[facet];
        return terms.reduce((acc, term) => {
            if (mapper.has(term)) {
                acc.push(...mapper.get(term));
            } else {
                acc.push(term);
                warn(`Unknown filter term for facet ${facet}: ${term}`);
            }
            return acc;
        }, [] as string[]);
    }

    private mapVocabsFilterTerms(
        vocabsScheme: VocabsScheme,
        terms: string[],
        language: Language | null,
    ): string[] {
        if (language !== null) {
            return terms.map((term) => vocabs.getId(vocabsScheme, term, language));
        } else {
            return terms;
        }
    }

    private mapCustomFacetBuckets(facet: T, buckets: Bucket[]): Bucket[] {
        const mapper = this.customTermsMappers[facet];
        return mapper.mapCustomFacetBuckets(buckets);
    }

    private mapVocabsFacetBuckets(
        vocabsScheme: VocabsScheme,
        buckets: Bucket[],
        language: Language | null,
    ): Bucket[] {
        if (language !== null) {
            return buckets.map((bucket) => {
                bucket.key = vocabs.getLabel(vocabsScheme, bucket.key, language);
                return bucket;
            });
        } else {
            return buckets;
        }
    }
}

function removeDuplicates<T>(array: T[]): T[] {
    return array.filter((element, index) => array.indexOf(element) === index);
}
