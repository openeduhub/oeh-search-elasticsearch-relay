import dotenv from 'dotenv';
import { logInfo } from './log';

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
        logRequests: parseEnvVariableBool('DEBUG_LOG_REQUESTS', { defaultValue: false }),
    },
};

logInfo('Loaded server configuration:', config);

function parseEnvVariableBool(
    variableKey: string,
    { defaultValue }: { defaultValue: boolean },
): boolean {
    const value = process.env[variableKey];
    if (typeof value !== 'string') {
        return defaultValue;
    } else if (['1', 'true', 'yes', 'on'].includes(value.toLowerCase())) {
        return true;
    } else if (['0', 'false', 'no', 'off'].includes(value.toLowerCase())) {
        return false;
    } else {
        console.warn(`WARNING: Invalid value "${value}" for boolean env variable "${variableKey}"`);
        return defaultValue;
    }
}
