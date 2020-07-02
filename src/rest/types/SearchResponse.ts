export interface SearchResponse {
    nodes: Node[];
    pagination: Pagination;
    // facettes: Facette[];
}

export interface Node {
    access: string[];
    aspects: string[] | null;
    collection: CollectionType;
    /**
     * @isInt commentCount
     */
    commentCount: number | null;
    content: Content;
    createdAt: string;
    createdBy: Person;
    downloadUrl: string;
    iconURL: string | null;
    isDirectory: boolean | null;
    license: LicenseType | null;
    mediatype: string | null;
    metadataset: string | null;
    mimetype: string | null;
    modifiedAt: string | null;
    modifiedBy: Person | null;
    name: string;
    owner: Person;
    parent: NodeRef | null;
    preview?: Preview;
    properties: { [key: string]: string[] };
    rating: AccumulatedRatings | null;
    ref: NodeRef;
    remote: Remote | null;
    repositoryType: string | null;
    size: string | null;
    title: string | null;
    type: string | null;
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

// tslint:disable-next-line:no-empty-interface
export interface Facette {
    // TODO
}

export interface NodeRef {
    archived: boolean;
    id: string;
    isHomeRepo?: boolean;
    repo: string;
}

export interface Content {
    hash: string | null;
    url: string | null;
    version: string | null;
}

// tslint:disable-next-line:no-empty-interface
export interface Remote {
    // TODO
}

// tslint:disable-next-line:no-empty-interface
export interface Person {
    // TODO
}

// Name `Collection` conflicts with Graphql type
// tslint:disable-next-line:no-empty-interface
export interface CollectionType {
    // TODO
}

export interface Preview {
    /**
     * @isInt height
     */
    height: number;
    isGenerated: boolean | null;
    isIcon: boolean;
    url: string;
    /**
     * @isInt width
     */
    width: number;
}

// tslint:disable-next-line:no-empty-interface
export interface AccumulatedRatings {
    // TODO
}

// Name `License` conflicts with Graphql type
// tslint:disable-next-line:no-empty-interface
export interface LicenseType {
    // TODO
}
