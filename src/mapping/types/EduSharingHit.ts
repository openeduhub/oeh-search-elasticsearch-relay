export interface Source {
    type: string;
    nodeRef: {
        id: string;
        storeRef: {
            protocol: 'workspace';
            identifier: 'SpacesStore';
        };
    };
    permissions: {
        read: string;
    };
    content: {
        fulltext: string;
    };
    preview: {
        mimetype?: string;
        small: string;
    };
    properties: {
        'cm:name': string;
        'cclom:title'?: string;
        'cclom:general_description'?: string[];
        'cclom:general_keyword'?: string[];
        'cclom:general_language'?: string[];
        'cclom:location': string[];
        'cclom:duration'?: string;
        'ccm:objecttype'?: string;
        'ccm:taxonid'?: string[];
        'ccm:educationalcontext'?: string[];
        'ccm:educationalintendedenduserrole'?: string[];
        'ccm:educationallearningresourcetype'?: string[];
        'ccm:replicationsource'?: string;
        'ccm:commonlicense_key'?: CommonLicenseKey;
        'ccm:collectiontype'?: string;
        'ccm:wwwurl'?: string;
    };
    collections: Array<Source>;
    aspects: string[];
}
export interface Fields {
    'properties_aggregated.cclom:general_keyword'?: string[];
    'properties_aggregated.ccm:commonlicense_key'?: string[];
    'properties_aggregated.ccm:educationalcontext'?: string[];
    'properties_aggregated.ccm:educationalintendedenduserrole'?: string[];
    'properties_aggregated.ccm:educationallearningresourcetype'?: string[];
    'properties_aggregated.ccm:license_oer'?: string[];
    'properties_aggregated.ccm:taxonid'?: string[];
}
export interface EduSharingHit {
    _source: Source;
    fields: Fields;
}

export enum CommonLicenseKey {
    CC_BY = 'CC_BY',
    CC_BY_SA = 'CC_BY_SA',
    CC_0 = 'CC_0',
    PDM = 'PDM',
    COPYRIGHT_FREE = 'COPYRIGHT_FREE',
}
