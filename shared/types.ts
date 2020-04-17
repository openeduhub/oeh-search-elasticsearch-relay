export interface SearchResponse {
    searchResults: Results;
    didYouMeanSuggestion: {
        plain: string;
        html: string;
    } | null;
    facets: Facets;
}


export type Filters = {
    [label in Facet]?: string[];
};

export interface Results {
    total: number;
    time: number; // ms
    results: Result[];
}

export interface Result {
    hash: string;
    source: {
        id: string;
        total_count: number;
        name: string;
        url: string;
    };
    thumbnail: {
        mimetype: string;
        small: string;
        large?: string;
    };
    lom: {
        technical: {
            location: string;
        };
        educational: {
            description: string;
        };
        classification: {};
        general: {
            title: string;
            identifier: string;
            keyword: string[];
        };
        rights: {
            description: string;
        };
        lifecycle: {};
    };
    id: string;
    fulltext: string;
    valuespaces?: {
        discipline?: {
            de: string;
        }[];
        educationalContext?: {
            de: string;
        }[];
        learningResourceType?: {
            de: string;
        }[];
    };
}


export type Facet = 'sources' | 'keywords' | 'disciplines' | 'educationalContexts' | 'learningResourceTypes';

export interface Bucket {
    key: string;
    doc_count: number;
}

export type Facets = {
    [label in Facet]: {
        buckets: Bucket[];
    };
};

export interface DidYouMeanSuggestion {
    plain: string;
    html: string;
}


