export interface MdsQueryCriteria {
    property: string;
    values: string[];
}

export interface SearchRequest {
    /**
     * Supports only a single criterion property 'ngsearchword' right now.
     *
     * Other criteria will be ignored.
     */
    criterias: MdsQueryCriteria[];
    /**
     * Ignored
     */
    facettes: string[];
}