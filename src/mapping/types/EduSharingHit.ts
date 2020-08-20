export interface EduSharingHit {
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
    properties: {
        'cm:name': string;
        'cclom:title'?: string;
        'cclom:general_description'?: string[];
        'cclom:general_keyword'?: string[];
        'cclom:location': string[];
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
    collections: Array<EduSharingHit>;
    aspects: string[];
}

export enum CommonLicenseKey {
    CC_BY = 'CC_BY',
    CC_BY_SA = 'CC_BY_SA',
    CC_0 = 'CC_0',
    PDM = 'PDM',
    COPYRIGHT_FREE = 'COPYRIGHT_FREE',
}
