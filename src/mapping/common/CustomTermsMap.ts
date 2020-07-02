import { Bucket, Facet } from '../../generated/graphql';

export interface OneToOneMap {
    type: 'one-to-one';
    map: { [targetValue: string]: string };
}

export interface OneToManyMap {
    type: 'one-to-many';
    map: { [targetValue: string]: string[] };
}

export type CustomTermsMap = OneToOneMap | OneToManyMap;

export type CustomTermsMaps = {
    [facet in Facet]?: CustomTermsMap;
};

type ReverseMap = { [sourceValue: string]: string };

export interface CustomTermsMapper {
    has(targetValue: string): boolean;
    get(targetValue: string): string[];
    getReverseMap(): ReverseMap;
    mapCustomFacetBuckets(buckets: Bucket[]): Bucket[];
}

class CustomOneToOneMap implements CustomTermsMapper {
    private reverseMap: ReverseMap;

    constructor(private readonly map: OneToOneMap['map']) {
        this.reverseMap = this.generateReverseMap(map);
    }

    has(targetValue: string): boolean {
        return targetValue in this.map;
    }

    get(targetValue: string): string[] {
        return [this.map[targetValue]];
    }

    getReverseMap(): ReverseMap {
        return this.reverseMap;
    }

    mapCustomFacetBuckets(buckets: Bucket[]): Bucket[] {
        return buckets.map((bucket) => ({
            key: this.reverseMap[bucket.key] ?? bucket.key,
            doc_count: bucket.doc_count,
        }));
    }

    private generateReverseMap(map: OneToOneMap['map']): ReverseMap {
        return Object.entries(map).reduce((acc, [targetValue, sourceValue]) => {
            acc[sourceValue] = targetValue;
            return acc;
        }, {} as ReverseMap);
    }
}

class CustomOneToManyMapper implements CustomTermsMapper {
    private reverseMap: ReverseMap;

    constructor(private readonly map: OneToManyMap['map']) {
        this.reverseMap = this.generateReverseMap(map);
    }

    has(targetValue: string): boolean {
        return targetValue in this.map;
    }

    get(targetValue: string): string[] {
        return this.map[targetValue];
    }

    getReverseMap(): ReverseMap {
        return this.reverseMap;
    }

    mapCustomFacetBuckets(buckets: Bucket[]): Bucket[] {
        return Object.entries(this.map)
            .map(([targetValue, sourceValues]) => ({
                key: targetValue,
                doc_count: buckets
                    .filter((bucket) => sourceValues.includes(bucket.key))
                    .reduce((acc, bucket) => {
                        acc += bucket.doc_count;
                        return acc;
                    }, 0),
            }))
            .sort(sortBucketsReverse);
    }

    private generateReverseMap(map: OneToManyMap['map']): ReverseMap {
        return Object.entries(map).reduce((acc, [targetValue, sourceValues]) => {
            for (const sourceValue of sourceValues) {
                acc[sourceValue] = targetValue;
            }
            return acc;
        }, {} as ReverseMap);
    }
}

export function getCustomTermsMapper(map: CustomTermsMap): CustomTermsMapper {
    switch (map.type) {
        case 'one-to-one':
            return new CustomOneToOneMap(map.map);
        case 'one-to-many':
            return new CustomOneToManyMapper(map.map);
    }
}

function sortBucketsReverse(lhs: Bucket, rhs: Bucket): -1 | 0 | 1 {
    if (lhs.doc_count < rhs.doc_count) {
        return 1;
    } else if (lhs.doc_count > rhs.doc_count) {
        return -1;
    } else {
        return 0;
    }
}
