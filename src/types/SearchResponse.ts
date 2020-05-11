export interface SearchResponse {
    nodes: Node[];
    pagination: Pagination;
    // facettes: Facette[];
}

export interface Node {
    ref: NodeRef;
    name: string;
    // createdAt: string;
    // createdBy: Person;
    // access: string[];
    // downloadUrl: string;
    // collection: CollectionType;
    // owner: Person;
    preview?: Preview;
    // ...
}

export interface Pagination {
    /**
     * Total number of results.
     * 
     * @isInt total
     */
    total: number;
    /**
     * Offset as requested by skipCount.
     * 
     * @isInt from
     */
    from: number;
    /**
     * Number of returned results as limited by maxItems.
     * 
     * @isInt count
     */
    count: number;
}

export interface Facette {
    // TODO
}

export interface NodeRef {
    // repo: string;
    id: string;
    // archived: boolean;
    // isHomeRepo?: boolean;
}

export interface Person {
    // TODO
}

export interface CollectionType { // TSOA doesn't like the name 'Collection'
    // TODO
}

export interface Preview {
    isIcon: boolean;
    isGenerated?: boolean;
    url: string;
    /**
     * @isInt width
     */
    width: number | null;
    /**
     * @isInt height
     */
    height: number | null;
}