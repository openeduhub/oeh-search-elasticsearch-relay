import { Body, Controller, Path, Post, Query, Response, Route } from 'tsoa';
import { config } from '../config';
import { client } from '../elasticSearchClient';
import { BadRequestError } from '../errors';
import { Hit } from '../generated/graphql';
import { generateSearchStringQuery } from '../resolvers/search';
import { ErrorResponse } from '../types/ErrorResponse';
import { SearchRequest } from '../types/SearchRequest';
import { Node, SearchResponse } from '../types/SearchResponse';

interface SearchParameters {
    from: number;
    size: number;
    searchString: string;
}

@Route('search/v1')
export class SearchController extends Controller {
    /**
     * Perform queries based on metadata sets V2.
     *
     * @isInt maxItems
     * @isInt skipCount
     */
    @Post('queriesV2/{repository}/{metadataset}/{query}')
    @Response<ErrorResponse>(400, 'Bad Request')
    @Response<ErrorResponse>(500, 'Internal Server Error')
    public async query(
        /**
         * Ignored
         */
        @Path() repository: string = '-home-',
        /**
         * Ignored
         */
        @Path() metadataset: string = '-default-',
        /**
         * Ignored
         */
        @Path() query: string = 'dummy',
        /**
         * Maximum items per page
         */
        @Query() maxItems: number = 10,
        /**
         * Skip a number of items
         */
        @Query() skipCount: number = 0,
        @Body() requestBody: SearchRequest,
    ): Promise<SearchResponse> {
        const searchString = this.parseSearchRequest(requestBody);
        const response = await this.search({ searchString, from: skipCount, size: maxItems });
        return response;
    }

    private parseSearchRequest(searchRequest: SearchRequest) {
        const searchWordCriterion = searchRequest.criterias.find(
            (criterion) => criterion.property === 'ngsearchword',
        );
        if (searchWordCriterion?.values?.length !== 1) {
            throw new BadRequestError(
                'Search criteria must contain "ngsearchword" with exactly one value',
            );
        }
        let searchString = searchWordCriterion.values[0];
        // Remove surrounding '*' if any
        const match = searchString.match(/^\*([\s\S]*)\*$/);
        if (match) {
            searchString = match[1];
        }
        return searchString;
    }

    private async search({ from, size, searchString }: SearchParameters) {
        const { body } = await client.search({
            body: {
                from,
                size,
                _source: {
                    includes: ['id', 'lom'],
                },
                query: generateSearchStringQuery(searchString),
            },
        });
        return this.parseSearchResponse(body, { from });
    }

    private parseSearchResponse(body: any, { from }: { from: number }): SearchResponse {
        return {
            nodes: body.hits.hits.map((hit: any) => this.mapNode(hit._source)),
            pagination: {
                total: body.hits.total.value,
                count: body.hits.hits.length,
                from,
            },
        };
    }

    private mapNode(hit: Hit): Node {
        const node: Node = {
            name: hit.lom.general.title,
            ref: {
                id: hit.id,
                // archived: false,
                // repo: 'local',
                // isHomeRepo: true,
            },
            preview: {
                height: null,
                width: null,
                isIcon: false,
                url: `${config.url}/rest/entry/${hit.id}/thumbnail`,
            },
        };
        return node;
    }
}
