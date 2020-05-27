import express from 'express';
import { Body, Controller, Path, Post, Query, Request, Response, Route } from 'tsoa';
import { config } from '../config';
import { client } from '../elasticSearchClient';
import { BadRequestError } from '../errors';
import { ErrorResponse } from '../types/ErrorResponse';
import { SearchRequest } from '../types/SearchRequest';
import { Node, SearchResponse, Person, CollectionType } from '../types/SearchResponse';

interface SearchParameters {
    from: number;
    size: number;
    searchString: string;
    preferredLanguage: string;
}

const supportedLanguages = ['de', 'en'];
const fallbackLanguage = 'en';

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
        /** Ignored */
        @Path() repository: string = '-home-',
        /** Ignored */
        @Path() metadataset: string = '-default-',
        /** Ignored */
        @Path() query: string = 'ngsearch',
        /** Maximum items per page */
        @Query() maxItems: number = 10,
        /** Skip a number of items */
        @Query() skipCount: number = 0,
        @Body() requestBody: SearchRequest,
        @Request() request: express.Request,
    ): Promise<SearchResponse> {
        const searchString = this.parseSearchRequest(requestBody);
        const preferredLanguage =
            request.acceptsLanguages(...supportedLanguages) || fallbackLanguage;
        return this.search({
            searchString,
            from: skipCount,
            size: maxItems,
            preferredLanguage,
        });
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

    private async search({ from, size, searchString, preferredLanguage }: SearchParameters) {
        const { body } = await client.search({
            body: {
                from,
                size,
                query: generateSearchStringQuery(searchString),
            },
        });
        return this.parseSearchResponse(body, { from, preferredLanguage });
    }

    private parseSearchResponse(
        body: any,
        { from, preferredLanguage }: { from: number; preferredLanguage: string },
    ): SearchResponse {
        return {
            nodes: body.hits.hits.map((hit: any) => this.mapNode(hit._source, preferredLanguage)),
            pagination: {
                total: body.hits.total.value,
                count: body.hits.hits.length,
                from,
            },
        };
    }

    private mapNode(hit: any, preferredLanguage: string): Node {
        const id = hit.nodeRef.id;
        // `Node` is modeled after the Edu-Sharing API. When we don't have the data for a required
        // field, we set it to `(null as unknown) as x` here.
        return {
            access: [],
            aspects: hit.aspects,
            collection: (null as unknown) as CollectionType,
            commentCount: 0,
            content: {
                hash: null,
                url: `${config.eduSharing.url}/components/render/${id}`,
                version: hit.properties['cm:versionLabel'],
            },
            createdAt: new Date(hit.properties['cm:created']).toISOString(),
            createdBy: (null as unknown) as Person,
            downloadUrl: `${config.eduSharing.url}/eduservlet/download?nodeId=${id}`,
            iconURL: null,
            isDirectory: hit.type === 'ccm:map',
            license: null,
            mediatype: null,
            metadataset: hit.properties['cm:edu_metadataset'],
            mimetype: hit.properties['cm:content'].mimetype,
            modifiedAt: new Date(hit.properties['cm:modified']).toISOString(),
            modifiedBy: null,
            name: hit.properties['cm:name'] || hit.properties['cclom:name'],
            owner: (null as unknown) as Person,
            parent: hit.path[hit.path.length - 1],
            preview: {
                height: (null as unknown) as number,
                isGenerated: null,
                isIcon: (null as unknown) as boolean,
                url:
                    `${config.eduSharing.url}/preview` +
                    `?nodeId=${id}` +
                    `&storeProtocol=${hit.nodeRef.storeRef.protocol}` +
                    `&storeId=${hit.nodeRef.storeRef.identifier}`,
                width: (null as unknown) as number,
            },
            properties: {
                ...this.mapProperties(hit.properties),
                ...this.mapI18nProperties(hit.i18n[preferredLanguage]),
            },
            rating: null,
            ref: {
                archived: hit.nodeRef.storeRef.protocol === 'archive',
                id,
                isHomeRepo: true,
                repo: 'local',
            },
            remote: null,
            repositoryType: 'ALFRESCO',
            size: hit.properties['cm:content'].size,
            title: hit.properties['cm:title'] || hit.properties['cclom:title'] || null,
            type: hit.type,
        };
    }

    private mapProperties(properties: { [key: string]: any }): { [key: string]: string[] } {
        return this.mapPropertyEntries(Object.entries(properties));
    }

    private mapI18nProperties(i18nProperties: { [key: string]: any }): { [key: string]: string[] } {
        const entries: [string, any][] = Object.entries(i18nProperties).map(([key, value]) => [
            `${key}_DISPLAYNAME`,
            value,
        ]);
        return this.mapPropertyEntries(entries);
    }

    private mapPropertyEntries(entries: [string, any][]): { [key: string]: string[] } {
        return entries.reduce((acc, [key, value]) => {
            if (typeof value === 'string') {
                acc[key] = [value];
            } else if (Array.isArray(value)) {
                acc[key] = value;
            } // else drop property
            return acc;
        }, {} as { [key: string]: string[] });
    }
}

/**
 * Has an equivalent function in the search resolver, but with different fields
 * until consolidated.
 */
export function generateSearchStringQuery(searchString: string) {
    return {
        multi_match: {
            query: searchString,
            type: 'cross_fields',
            fields: [
                'properties.cm:title^3',
                'properties.cm:name^3',
                'properties.cclom:title^3',
                'properties.cclom:name^3',
                'properties.cclom:general_keyword',
                'properties.cclom:general_description',
            ],
            operator: 'and',
        },
    };
}
