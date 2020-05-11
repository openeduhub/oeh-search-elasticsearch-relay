import dotenv from 'dotenv';

dotenv.config();

export const config = {
    production: process.env.NODE_ENV === 'production',
    port: process.env.PORT || '3000',
    url: process.env.URL || `http://localhost:3000`,
    elasticSearch: {
        url: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
        index: process.env.ELASTICSEARCH_INDEX || 'search_idx',
    }
}