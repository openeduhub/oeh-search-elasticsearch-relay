import dotenv from 'dotenv';

dotenv.config();

type IndexMapping = 'legacy' | 'edu-sharing';

export const config = {
    production: process.env.NODE_ENV === 'production',
    port: process.env.PORT || '3000',
    url: process.env.URL || `http://localhost:3000`,
    frontend: {
        url: process.env.FRONTEND_URL || 'http://localhost:4200',
    },
    elasticSearch: {
        url: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
        index: process.env.ELASTICSEARCH_INDEX || 'workspace',
        mapping: (process.env.ELASTICSEARCH_MAPPING as IndexMapping) || 'edu-sharing',
    },
    eduSharing: {
        url: process.env.EDUSHARING_URL || 'http://localhost/edu-sharing',
    },
    debug: {
        logRequests: parseBool(process.env.DEBUG_LOG_REQUESTS) || false,
    },
};

function parseBool(variable?: string): boolean | undefined {
    if (typeof variable !== 'string' || variable.length === 0) {
        return undefined;
    }
    return ['1', 'true', 'yes', 'on'].includes(variable.toLowerCase());
}
