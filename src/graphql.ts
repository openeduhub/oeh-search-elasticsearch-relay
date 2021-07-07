/*
 * ------------------------------------------------------
 * THIS FILE WAS AUTOMATICALLY GENERATED (DO NOT MODIFY)
 * -------------------------------------------------------
 */

/* tslint:disable */
/* eslint-disable */
export enum EditorialTag {
    recommended = 'recommended',
}

export enum Facet {
    source = 'source',
    keyword = 'keyword',
    discipline = 'discipline',
    educationalContext = 'educationalContext',
    learningResourceType = 'learningResourceType',
    intendedEndUserRole = 'intendedEndUserRole',
    type = 'type',
    editorialTag = 'editorialTag',
}

export enum Language {
    de = 'de',
    en = 'en',
}

export enum SimpleFilter {
    oer = 'oer',
}

export enum TotalHitsRelation {
    eq = 'eq',
    gte = 'gte',
}

export enum Type {
    content = 'content',
    portal = 'portal',
    tool = 'tool',
    lessonPlanning = 'lessonPlanning',
    method = 'method',
}

export interface Filter {
    facet?: Facet;
    simpleFilter?: SimpleFilter;
    terms?: string[];
}

export interface Aggregation {
    __typename?: 'Aggregation';
    facet: Facet;
    buckets: Bucket[];
    total_buckets: number;
}

export interface Bucket {
    __typename?: 'Bucket';
    key: string;
    doc_count: number;
}

export interface Collection {
    __typename?: 'Collection';
    id: string;
    name: string;
    numberElements: number;
    url: string;
    thumbnail: EmbeddedThumbnail;
}

export interface DidYouMeanSuggestion {
    __typename?: 'DidYouMeanSuggestion';
    plain: string;
    html: string;
}

export interface EmbeddedThumbnail {
    __typename?: 'EmbeddedThumbnail';
    mimetype: string;
    image: string;
}

export interface ExternalThumbnail {
    __typename?: 'ExternalThumbnail';
    url: string;
}

export interface Hit {
    __typename?: 'Hit';
    id: string;
    lom: Lom;
    skos: Skos;
    type: Type;
    source: Source;
    license: License;
    editorialTags: EditorialTag[];
    previewImage: PreviewImage;
    misc: Misc;
    collections?: Collection[];
}

export interface License {
    __typename?: 'License';
    oer: boolean;
    displayName?: string;
}

export interface Lom {
    __typename?: 'Lom';
    technical: LomTechnical;
    general: LomGeneral;
    lifecycle: LomLifecycle;
}

export interface LomContribute {
    __typename?: 'LomContribute';
    role: string;
    entity: string;
}

export interface LomGeneral {
    __typename?: 'LomGeneral';
    title: string;
    keyword?: string[];
    description?: string;
    language?: string[];
}

export interface LomLifecycle {
    __typename?: 'LomLifecycle';
    contribute?: LomContribute[];
}

export interface LomTechnical {
    __typename?: 'LomTechnical';
    location: string;
    duration?: number;
    format?: string;
}

export interface Misc {
    __typename?: 'Misc';
    author?: string;
}

export interface PreviewImage {
    __typename?: 'PreviewImage';
    thumbnail: Thumbnail;
    url: string;
}

export interface IQuery {
    __typename?: 'IQuery';
    search(
        size: number,
        searchString?: string,
        language?: Language,
        filters?: Filter[],
        includeCollectionTags?: boolean,
        from?: number,
    ): SearchResult | Promise<SearchResult>;
    get(id: string, language?: Language): Hit | Promise<Hit>;
    facet(
        facet: Facet,
        size: number,
        searchString?: string,
        filters?: Filter[],
        language?: Language,
        skipOutputMapping?: boolean,
    ): Aggregation | Promise<Aggregation>;
    facets(
        facets: Facet[],
        size: number,
        searchString?: string,
        filters?: Filter[],
        language?: Language,
        skipOutputMapping?: boolean,
    ): Aggregation[] | Promise<Aggregation[]>;
    autoComplete(
        searchString: string,
        filters?: Filter[],
        language?: Language,
    ): string[] | Promise<string[]>;
    didYouMeanSuggestion(
        searchString: string,
        filters?: Filter[],
        language?: Language,
    ): DidYouMeanSuggestion | Promise<DidYouMeanSuggestion>;
    subjectsPortals(size: number, language: Language): SubjectsPortals | Promise<SubjectsPortals>;
    facetSuggestions(
        facets: Facet[],
        size: number,
        language: Language,
        inputString?: string,
        searchString?: string,
        filters?: Filter[],
    ): Aggregation[] | Promise<Aggregation[]>;
}

export interface SearchResult {
    __typename?: 'SearchResult';
    took: number;
    total: TotalHits;
    hits: Hit[];
}

export interface Skos {
    __typename?: 'Skos';
    discipline?: SkosEntry[];
    educationalContext?: SkosEntry[];
    learningResourceType?: SkosEntry[];
    intendedEndUserRole?: SkosEntry[];
    conditionsOfAccess?: SkosEntry[];
    price?: SkosEntry[];
    widgets?: SkosEntry[];
    containsAdvertisement?: SkosEntry[];
}

export interface SkosEntry {
    __typename?: 'SkosEntry';
    id: string;
    label: string;
}

export interface Source {
    __typename?: 'Source';
    id: string;
    name: string;
    url: string;
}

export interface SubjectsPortalDiscipline {
    __typename?: 'SubjectsPortalDiscipline';
    id: string;
    url: string;
    doc_count: number;
}

export interface SubjectsPortals {
    __typename?: 'SubjectsPortals';
    grundschule: SubjectsPortalDiscipline[];
    sekundarstufe_1: SubjectsPortalDiscipline[];
    sekundarstufe_2: SubjectsPortalDiscipline[];
    berufliche_bildung: SubjectsPortalDiscipline[];
    erwachsenenbildung: SubjectsPortalDiscipline[];
    allgemeinbildende_schule: SubjectsPortalDiscipline[];
    foerderschule: SubjectsPortalDiscipline[];
}

export interface TotalHits {
    __typename?: 'TotalHits';
    value: number;
    relation: TotalHitsRelation;
}

export type Thumbnail = EmbeddedThumbnail | ExternalThumbnail;
