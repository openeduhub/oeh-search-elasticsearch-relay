import { Client, RequestParams } from '@elastic/elasticsearch';
import { config } from './config';

class ElasticSearchClient {
    private readonly client = new Client({ node: config.elasticSearch.url });
    private readonly index = config.elasticSearch.index;

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