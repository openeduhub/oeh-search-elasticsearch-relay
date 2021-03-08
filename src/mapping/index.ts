import { config } from '../common/config';
import { EduSharingMapping } from './EduSharingMapping';

export const mapping = (() => {
    switch (config.elasticSearch.mapping) {
        case 'edu-sharing':
            return new EduSharingMapping();
        default:
            throw new Error(`Invalid mapping: ${config.elasticSearch.mapping}`);
    }
})();
