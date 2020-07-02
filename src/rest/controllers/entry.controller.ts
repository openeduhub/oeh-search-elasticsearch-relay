import { Readable } from 'stream';
import { Controller, Get, Path, Response, Route } from 'tsoa';
import { client } from '../../common/elasticSearchClient';
import { LegacyHit } from '../../mapping/types/LegacyHit';
import { NotFoundError } from '../../server/errors';
import { ErrorResponse } from '../types/ErrorResponse';
import { bufferToReadable } from '../utils';

@Route('entry')
export class EntryController extends Controller {
    @Get('{id}/thumbnail')
    @Response<ErrorResponse>(400, 'Bad Request')
    @Response<ErrorResponse>(500, 'Internal Server Error')
    // @Produces('image/*') // hopefully something like this will work in the future
    async getThumbnail(@Path() id: string): Promise<Readable> {
        const { body } = await client.search({
            body: {
                query: { term: { _id: id } },
            },
            _source: ['thumbnail'],
        });
        const hit = this.parseResponse(body, id);
        if (!hit.thumbnail?.mimetype) {
            throw new NotFoundError(`Entry with id ${id} does not provide a thumbnail`);
        }
        const base64 = hit.thumbnail.large || hit.thumbnail.small;
        const buffer = Buffer.from(base64, 'base64');
        this.setHeader('Content-Type', hit.thumbnail.mimetype);
        this.setHeader('Cache-Control', 'public, max-age=86400, immutable'); // cache for a day
        return bufferToReadable(buffer);
    }

    private parseResponse(body: any, id: string): LegacyHit {
        if (body.hits.total.value === 0) {
            throw new NotFoundError(`No entry with id ${id}`);
        } else if (body.hits.total.value !== 1) {
            throw new Error(`Got ${body.hits.total.value} results when requesting entry by id`);
        }
        return body.hits.hits[0]._source;
    }
}
