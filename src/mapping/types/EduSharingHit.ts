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
    content?: {
        fulltext: string;
        mimetype: string;
    };
    preview: {
        mimetype?: string;
        small: string;
    };
    properties: {
        'cclom:duration'?: string;
        'cclom:general_description'?: string[];
        'cclom:general_keyword'?: string[];
        'cclom:general_language'?: string[];
        'cclom:location': string[];
        'cclom:rights_description'?: string;
        'cclom:title'?: string;
        'ccm:collectiontype'?: string;
        'ccm:commonlicense_key'?: CommonLicenseKey;
        'ccm:educationalcontext'?: string[];
        'ccm:educationalintendedenduserrole'?: string[];
        'ccm:educationallearningresourcetype'?: string[];
        'ccm:objecttype'?: string;
        'ccm:replicationsource'?: string;
        'ccm:taxonid'?: string[];
        'ccm:wwwurl'?: string;
        'cm:name': string;
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
    'properties_aggregated.ccm:conditionsOfAccess'?: string[];
    'properties_aggregated.ccm:oeh_widgets'?: string[];
    'properties_aggregated.ccm:price'?: string[];
    'properties_aggregated.ccm:containsAdvertisement'?: string[];
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
