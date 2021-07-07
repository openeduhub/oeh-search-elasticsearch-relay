import { config } from '../common/config';
import { EduSharingMapping } from './edu-sharing/EduSharingMapping';
import { Mapping } from './Mapping';

export const mapping = (() => {
    switch (config.elasticSearch.mapping) {
        case 'edu-sharing':
            return new EduSharingMapping();
        default:
            throw new Error(`Invalid mapping: ${config.elasticSearch.mapping}`);
    }
})();

type extractGeneric<Type> = Type extends Mapping<infer X> ? X : never;
export type SourceHit = extractGeneric<typeof mapping>;
