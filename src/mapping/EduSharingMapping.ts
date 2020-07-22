import { config } from '../common/config';
import { VocabsScheme } from '../common/vocabs';
import { EditorialTag, Facet, Hit, Language, SkosEntry, Type } from '../generated/graphql';
import { CommonMapper } from './common/CommonMapper';
import { CustomTermsMaps } from './common/CustomTermsMap';
import { MapFacetBuckets, MapFilterTerms, Mapping } from './Mapping';
import { CommonLicenseKey, EduSharingHit } from './types/EduSharingHit';

export const VALUE_NOT_AVAILABLE = 'N/A';

const customTermsMaps: CustomTermsMaps = {
    [Facet.Oer]: {
        type: 'one-to-many',
        map: {
            true: [
                CommonLicenseKey.CC_0,
                CommonLicenseKey.CC_BY,
                CommonLicenseKey.CC_BY_SA,
                CommonLicenseKey.PDM,
            ],
            false: [CommonLicenseKey.COPYRIGHT_FREE],
        },
    },
    [Facet.Type]: {
        type: 'one-to-one',
        map: {
            [Type.Content]: 'MATERIAL',
            [Type.Portal]: 'SOURCE',
            [Type.Tool]: 'TOOL',
            [Type.LessonPlanning]: 'LESSONPLANNING',
        },
    },
    [Facet.EditorialTag]: {
        type: 'one-to-many',
        map: {
            [EditorialTag.Recommended]: ['EDITORIAL'],
        },
    },
    [Facet.Source]: {
        type: 'one-to-one',
        map: {
            ['Wir Lernen Online']: 'wirlernenonline_spider',
            ['Bayerischer Rundfunk']: 'br_rss_spider',
            ['digital.learning.lab']: 'digitallearninglab_spider',
            ['GeoGebra']: 'geogebra_spider',
            ['LEIFIphysik']: 'leifi_spider',
            ['MediothekPixiothek']: 'mediothek_pixiothek_spider',
            ['memucho']: 'memucho_spider',
            ['Merlin']: 'merlin_spider',
            ['FWU Sodis Contentpool']: 'oai_sodis_spider',
            ['planet schule']: 'planet_schule_spider',
            ['Sample Source']: 'sample_spider',
            ['Serlo']: 'serlo_spider',
            ['tutory']: 'tutory_spider',
            ['Themenportal']: 'wirlernenonline_gsheet_spider',
            ['ZDF']: 'zdf_rss_spider',
            ['OER-Repositorium Baden-Württemberg (ZOERR)']: 'zoerr_spider',
            ['ZUM-Unterrichten']: 'zum_spider',
            ['iRights.info']: 'irights_spider',
        },
    },
};

const sourceUrls: { [spiderName: string]: string } = {
    wirlernenonline_spider: 'https://wirlernenonline.de/',
    br_rss_spider: 'https://www.br.de/',
    digitallearninglab_spider: 'https://digitallearninglab.de',
    geogebra_spider: 'https://www.geogebra.org',
    leifi_spider: 'https://www.leifiphysik.de/',
    mediothek_pixiothek_spider: 'https://www.schulportal-thueringen.de/',
    memucho_spider: 'https://memucho.de',
    merlin_spider: 'http://merlin.nibis.de/index.php',
    oai_sodis_spider: 'https://fwu.de/',
    planet_schule_spider: 'https://www.planet-schule.de',
    sample_spider: 'https://edu-sharing.com',
    serlo_spider: 'https://de.serlo.org',
    tutory_spider: 'https://www.tutory.de/',
    wirlernenonline_gsheet_spider:
        'https://docs.google.com/spreadsheets/d/e/' +
        '2PACX-1vTmqeYqGD0TADaSkON3zgK66BGTOcPGtsrE280j0wZ8WKtuGL8LZtnKFRIH6HU1FEYIAP28mOWsJYiN/' +
        'pub?gid=0&single=true&output=csv',
    zdf_rss_spider: 'https://www.zdf.de/',
    zoerr_spider: 'https://www.oerbw.de',
    zum_spider: 'https://unterrichten.zum.de/',
    irights_spider: 'https://irights.info/',
    [VALUE_NOT_AVAILABLE]: '',
};

export class EduSharingMapping implements Mapping<EduSharingHit> {
    readonly facetFields: { [facet in Facet]: string } = {
        [Facet.Discipline]: `properties.ccm:taxonid.keyword`,
        [Facet.LearningResourceType]: `properties.ccm:educationallearningresourcetype.keyword`,
        [Facet.EducationalContext]: `properties.ccm:educationalcontext.keyword`,
        [Facet.IntendedEndUserRole]: `properties.ccm:educationalintendedenduserrole.keyword`,
        [Facet.Keyword]: 'properties.cclom:general_keyword.keyword',
        [Facet.Source]: 'properties.ccm:replicationsource.keyword',
        [Facet.Oer]: 'properties.ccm:commonlicense_key.keyword',
        [Facet.Type]: 'properties.ccm:objecttype.keyword',
        [Facet.EditorialTag]: 'collections.properties.ccm:collectiontype.keyword',
    };
    readonly mapFilterTerms: MapFilterTerms;
    readonly mapFacetBuckets: MapFacetBuckets;
    private readonly commonMapper = new CommonMapper(customTermsMaps);

    constructor() {
        this.mapFilterTerms = this.commonMapper.mapFilterTerms.bind(this.commonMapper);
        this.mapFacetBuckets = this.commonMapper.mapFacetBuckets.bind(this.commonMapper);
    }

    mapHit(source: EduSharingHit, language: Language | null): Hit {
        return {
            id: source.nodeRef.id,
            lom: {
                general: {
                    title: source.properties['cclom:title'] || source.properties['cm:name'],
                    description: source.properties['cclom:general_description']?.[0] ?? null,
                },
                technical: {
                    location: source.properties['cclom:location'][0],
                },
            },
            skos: {
                discipline: source.properties['ccm:taxonid']?.map((entry) =>
                    this.mapSkos(Facet.Discipline, entry, language),
                ),
                educationalContext: source.properties['ccm:educationalcontext']?.map((entry) =>
                    this.mapSkos(Facet.EducationalContext, entry, language),
                ),
                learningResourceType: source.properties[
                    'ccm:educationallearningresourcetype'
                ]?.map((entry) => this.mapSkos(Facet.LearningResourceType, entry, language)),
                intendedEndUserRole: source.properties[
                    'ccm:educationalintendedenduserrole'
                ]?.map((entry) => this.mapSkos(Facet.IntendedEndUserRole, entry, language)),
            },
            type: source.properties['ccm:objecttype']
                ? (this.commonMapper.map(
                      Facet.Type,
                      source.properties['ccm:objecttype'],
                      language,
                  ) as Type)
                : Type.Content,
            source: {
                id: source.properties['ccm:replicationsource'] ?? VALUE_NOT_AVAILABLE,
                name: this.commonMapper.map(
                    Facet.Source,
                    source.properties['ccm:replicationsource'] ?? VALUE_NOT_AVAILABLE,
                    language,
                ),
                url:
                    sourceUrls[source.properties['ccm:replicationsource'] ?? VALUE_NOT_AVAILABLE] ??
                    '',
            },
            license: {
                oer: source.properties['ccm:commonlicense_key']
                    ? this.commonMapper.map(
                          Facet.Oer,
                          source.properties['ccm:commonlicense_key'],
                          language,
                      ) === 'true'
                    : false,
            },
            editorialTags: source.collections?.some(
                (collection) => collection.properties['ccm:collectiontype'],
            )
                ? (this.commonMapper.mapArray(
                      Facet.EditorialTag,
                      source.collections
                          .map((collections) => collections.properties['ccm:collectiontype'])
                          .filter((collectionType) => collectionType !== undefined) as string[],
                      language,
                  ) as EditorialTag[])
                : [],
            previewImage: {
                thumbnail: {
                    __typename: 'ExternalThumbnail',
                    url: this.getPreviewUrl(source, { size: 'thumbnail' }),
                },
                url: this.getPreviewUrl(source, { size: 'original' }),
            },
        };
    }

    getIdQuery(id: string) {
        return { term: { 'nodeRef.id': id } };
    }

    getSources() {
        return {
            excludes: ['i18n', 'content.fulltext'],
        };
    }

    getSearchQueryFields(language: Language | null): string[] {
        const result = [
            'properties.cclom:title^3',
            'properties.cm:name',
            'properties.cclom:general_keyword',
            'properties.cclom:general_description',
            'content.fulltext',
        ];
        if (language) {
            result.push(`i18n.${language}.*`);
        }
        return result;
    }

    getShouldTerms() {
        return {
            'collections.properties.ccm:collectiontype': ['EDITORIAL'],
            boost: 1,
        };
    }

    getAutoCompleteConfig() {
        return null;
    }

    getDidYouMeanSuggestionField(): string {
        return 'properties.cclom:title';
    }

    getStaticFilters() {
        return [
            { terms: { type: ['ccm:io'] } },
            { terms: { 'permissions.read': ['GROUP_EVERYONE'] } },
            { terms: { 'properties.cm:edu_metadataset': ['mds_oeh'] } },
            { terms: { 'nodeRef.storeRef.protocol': ['workspace'] } },
        ];
    }

    getStaticNegativeFilters() {
        return [{ term: { aspects: 'ccm:collection_io_reference' } }];
    }

    private mapSkos(vocabsScheme: VocabsScheme, id: string, language: Language | null): SkosEntry {
        return {
            id,
            label: this.commonMapper.map(vocabsScheme, id, language),
        };
    }

    private getPreviewUrl(source: EduSharingHit, { size }: { size: 'original' | 'thumbnail' }) {
        let url =
            `${config.eduSharing.url}/preview` +
            `?nodeId=${source.nodeRef.id}` +
            `&storeProtocol=${source.nodeRef.storeRef.protocol}` +
            `&storeId=${source.nodeRef.storeRef.identifier}`;
        if (size === 'thumbnail') {
            url += '&crop=true&maxWidth=200&maxHeight=200';
        }
        return url;
    }
}
