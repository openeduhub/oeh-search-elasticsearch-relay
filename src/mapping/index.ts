import { config } from '../common/config';
import { EduSharingMapping } from './EduSharingMapping';
import { LegacyMapping } from './LegacyMapping';

export const mapping = (() => {
    switch (config.elasticSearch.mapping) {
        case 'legacy':
            return new LegacyMapping();
        case 'edu-sharing':
            return new EduSharingMapping();
        default:
            throw new Error(`Invalid mapping: ${config.elasticSearch.mapping}`);
    }
})();
