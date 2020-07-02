type Maybe<T> = T | null;
/** All built-in and custom scalars, mapped to their actual values */
type Scalars = {
    ID: string;
    String: string;
    Boolean: boolean;
    Int: number;
    Float: number;
};

export type LegacyHit = {
    /** Content source */
    source: Source;
    /** A preview image */
    thumbnail: Thumbnail;
    /** Metadata according to the LOM standard */
    lom: Lom;
    collection?: Maybe<Array<Collection>>;
    license?: Maybe<License>;
    type: Scalars['String'];
    id: Scalars['ID'];
    /** Full text for search, not meant to be displayed */
    fulltext: Scalars['String'];
    /** Additional metadata to categorize content */
    valuespaces?: Maybe<Valuespaces>;
};

export enum OerType {
    None = 'NONE',
    Mixed = 'MIXED',
    All = 'ALL',
}

type License = {
    __typename?: 'License';
    url?: Maybe<Scalars['String']>;
    internal?: Maybe<Scalars['String']>;
    oer?: Maybe<OerType>;
};

type Collection = {
    __typename?: 'Collection';
    uuid: Scalars['ID'];
    name: Scalars['String'];
    created: Scalars['String'];
    last_updated: Scalars['String'];
    data?: Maybe<CollectionData>;
};

type CollectionData = {
    __typename?: 'CollectionData';
    editorial?: Maybe<Scalars['Boolean']>;
};

type Source = {
    __typename?: 'Source';
    /** A unique string that identifies the source */
    id: Scalars['ID'];
    /** Number of materials provided by the source */
    total_count: Scalars['Int'];
    /** A friendly name to display */
    name: Scalars['String'];
    /** The source's web presence */
    url: Scalars['String'];
};

type Thumbnail = {
    __typename?: 'Thumbnail';
    mimetype: Scalars['String'];
    /** Base64-encoded image in the format given by `mimetype`, low resolution */
    small: Scalars['String'];
    /** Base64-encoded image in the format given by `mimetype`, high resolution */
    large?: Maybe<Scalars['String']>;
};

type Lom = {
    __typename?: 'Lom';
    technical: LomTechnical;
    educational?: Maybe<LomEducational>;
    general: LomGeneral;
};

type LomTechnical = {
    __typename?: 'LomTechnical';
    /** Content URL */
    location: Scalars['String'];
};

type LomEducational = {
    __typename?: 'LomEducational';
    description?: Maybe<Scalars['String']>;
};

type LomGeneral = {
    __typename?: 'LomGeneral';
    title: Scalars['String'];
    identifier?: Maybe<Scalars['ID']>;
    keyword?: Maybe<Array<Scalars['String']>>;
    description?: Maybe<Scalars['String']>;
};

type Valuespaces = {
    __typename?: 'Valuespaces';
    discipline?: Maybe<Array<InternationalString>>;
    educationalContext?: Maybe<Array<InternationalString>>;
    learningResourceType?: Maybe<Array<InternationalString>>;
    intendedEndUserRole?: Maybe<Array<InternationalString>>;
};

export type InternationalString = {
    __typename?: 'InternationalString';
    key: Scalars['String'];
    de: Scalars['String'];
    en?: Maybe<Scalars['String']>;
};
