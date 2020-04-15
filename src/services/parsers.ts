import { Query, ParamsDictionary } from 'express-serve-static-core';
import { HTTP400Error } from '../utils/httpErrors';
import { Filters } from './search';

export interface SearchParams {
    searchString?: string;
    pageIndex?: number;
    pageSize?: number;
    filters?: Filters;
}

export function parseSearchParams(query: Query): SearchParams {
    const searchParams: SearchParams = {};
    if (query.q && typeof query.q === 'string') {
        searchParams.searchString = query.q;
    }
    if (query.pageIndex && typeof query.pageIndex === 'string') {
        searchParams.pageIndex = parseInt(query.pageIndex, 10);
        if (isNaN(searchParams.pageIndex)) {
            throw new HTTP400Error('Parameter pageIndex is not number');
        }
    }
    if (query.pageSize && typeof query.pageSize === 'string') {
        searchParams.pageSize = parseInt(query.pageSize, 10);
        if (isNaN(searchParams.pageSize)) {
            throw new HTTP400Error('Parameter pageSize is not number');
        }
    }
    if (query.filters && typeof query.filters === 'string') {
        try {
            searchParams.filters = JSON.parse(query.filters);
        } catch (e) {
            throw new HTTP400Error('Parameter filters is not valid JSON');
        }
    }
    return searchParams;
}

export function parseDetailsParams(params: ParamsDictionary): string {
    if (params.id && typeof params.id === 'string') {
        return params.id;
    } else {
        throw new HTTP400Error('Missing parameter id');
    }
}

export function parseAutoCompleteParams(query: Query): string {
    if (query.q && typeof query.q === 'string') {
        return query.q;
    } else {
        throw new HTTP400Error('Missing parameter q');
    }
}
