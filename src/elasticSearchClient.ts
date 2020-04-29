import dotenv from 'dotenv';
import { Client, RequestParams } from '@elastic/elasticsearch';

dotenv.config();

class ElasticSearchClient {
    private readonly client = new Client({ node: process.env.ELASTICSEARCH_URL });
    private readonly index = process.env.INDEX;

    async search(params: RequestParams.Search) {
        try {
            return await this.client.search({ index: this.index, ...params });
        } catch (error) {
            console.error(error.meta.body.error);
            throw error;
        }
    }
}

export const client = new ElasticSearchClient();;