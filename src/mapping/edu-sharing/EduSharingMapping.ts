import { Query } from 'elastic-ts';
import { config } from '../../common/config';
import { VocabsScheme } from '../../common/vocabs';
import { EditorialTag, Facet, Hit, Language, SimpleFilter, SkosEntry, Type } from '../../graphql';
import { CommonMapper } from '../common/CommonMapper';
import { CustomTermsMaps } from '../common/CustomTermsMap';
import { MapFacetBuckets, MapFilterTerms, Mapping } from '../Mapping';
import { CollectionsMapping } from './CollectionsMapping';
import { contributeMapping } from './ContributeMapping';
import { licenseMapping } from './LicenseMapping';
import { miscMapping } from './MiscMapping';
import { oerMapping } from './OerMapping';
import { EduSharingHit, Source } from './types/EduSharingHit';

export const VALUE_NOT_AVAILABLE = 'N/A';

const customTermsMaps: CustomTermsMaps = {
    [Facet.type]: {
        type: 'one-to-one',
        map: {
            [Type.content]: 'MATERIAL',
            [Type.portal]: 'SOURCE',
            [Type.tool]: 'TOOL',
            [Type.lessonPlanning]: 'LESSONPLANNING',
            [Type.method]: 'METHOD',
        },
    },
    [Facet.editorialTag]: {
        type: 'one-to-many',
        map: {
            [EditorialTag.recommended]: ['EDITORIAL'],
        },
    },
    [Facet.source]: {
        type: 'one-to-one',
        map: {
            ['Bayerischer Rundfunk']: 'br_rss_spider',
            ['Biologie-Lernprogramme']: 'biologie_lernprogramme_spider',
            ['Bundeszentrale für politische Bildung']: 'bpb_spider',
            ['Chemie-Lernprogramme']: 'chemie_lernprogramme_spider',
            ['digital.learning.lab']: 'digitallearninglab_spider',
            ['FWU Sodis Contentpool']: 'oai_sodis_spider',
            ['GeoGebra']: 'geogebra_spider',
            ['iRights.info']: 'irights_spider',
            ['Klexikon']: 'zum_klexikon_spider',
            ['LEIFIphysik']: 'leifi_spider',
            ['MediothekPixiothek']: 'mediothek_pixiothek_spider',
            ['memucho']: 'memucho_spider',
            ['Merlin']: 'merlin_spider',
            ['OER-Repositorium Baden-Württemberg (ZOERR)']: 'zoerr_spider',
            ['planet schule']: 'planet_schule_spider',
            ['Quizdidaktik']: 'quizdidaktik_spider',
            ['Sample Source']: 'sample_spider',
            ['Schulcampus RLP']: 'rlp_spider',
            ['segu']: 'segu_spider',
            ['Serlo']: 'serlo_spider',
            ['Themenportal']: 'wirlernenonline_gsheet_spider',
            ['tutory']: 'tutory_spider',
            ['Wir Lernen Online']: 'wirlernenonline_spider',
            ['Youtube']: 'youtube_spider',
            ['ZDF']: 'zdf_rss_spider',
            ['ZUM Deutsch Lernen']: 'zum_deutschlernen_spider',
            ['ZUM-Unterrichten']: 'zum_spider',
            ['Fobizz']: 'fobizz_spider',
            ['Schule im Aufbruch']: 'schule_im_aufbruch_spider',
            ['KindOERgarten']: 'kindoergarten_spider',
            ['rpi-virtuell']: 'rpi_virtuell_spider',
        },
    },
};

const sourceUrls: { [spiderName: string]: string } = {
    biologie_lernprogramme_spider: 'https://biologie-lernprogramme.de/',
    bpb_spider: 'https://www.bpb.de/',
    br_rss_spider: 'https://www.br.de/',
    chemie_lernprogramme_spider: 'https://chemie-lernprogramme.de/',
    digitallearninglab_spider: 'https://digitallearninglab.de',
    geogebra_spider: 'https://www.geogebra.org',
    irights_spider: 'https://irights.info/',
    leifi_spider: 'https://www.leifiphysik.de/',
    mediothek_pixiothek_spider: 'https://www.schulportal-thueringen.de/',
    memucho_spider: 'https://memucho.de',
    merlin_spider: 'http://merlin.nibis.de/index.php',
    oai_sodis_spider: 'https://fwu.de/',
    planet_schule_spider: 'https://www.planet-schule.de',
    quizdidaktik_spider: 'https://quizdidaktik.de/',
    rlp_spider: 'https://cloud.schulcampus-rlp.de/',
    sample_spider: 'https://edu-sharing.com',
    segu_spider: 'https://segu-geschichte.de/',
    serlo_spider: 'https://de.serlo.org',
    tutory_spider: 'https://www.tutory.de/',
    wirlernenonline_gsheet_spider:
        'https://docs.google.com/spreadsheets/d/e/' +
        '2PACX-1vTmqeYqGD0TADaSkON3zgK66BGTOcPGtsrE280j0wZ8WKtuGL8LZtnKFRIH6HU1FEYIAP28mOWsJYiN/' +
        'pub?gid=0&single=true&output=csv',
    wirlernenonline_spider: 'https://wirlernenonline.de/',
    youtube_spider: 'https://www.youtube.com/',
    zdf_rss_spider: 'https://www.zdf.de/',
    zoerr_spider: 'https://www.oerbw.de',
    zum_deutschlernen_spider: 'https://deutsch-lernen.zum.de/',
    zum_klexikon_spider: 'https://klexikon.zum.de/',
    zum_spider: 'https://unterrichten.zum.de/',
    fobizz_spider: 'https://fobizz.com',
    schule_im_aufbruch_spider: 'https://vimeo.com/user12637410/videos',
    kindoergarten_spider: 'https://kindoergarten.wordpress.com/',
    rpi_virtuell_spider: 'https://material.rpi-virtuell.de',
    [VALUE_NOT_AVAILABLE]: '',
};

export class EduSharingMapping implements Mapping<EduSharingHit> {
    private static readonly LOCATION_LOCAL_PREFIX = 'ccrep://local/';

    readonly facetFields: { [facet in Facet]: string } = {
        [Facet.discipline]: `properties_aggregated.ccm:taxonid`,
        [Facet.learningResourceType]: `properties_aggregated.ccm:educationallearningresourcetype`,
        [Facet.educationalContext]: `properties_aggregated.ccm:educationalcontext`,
        [Facet.intendedEndUserRole]: `properties_aggregated.ccm:educationalintendedenduserrole`,
        [Facet.keyword]: 'properties_aggregated.cclom:general_keyword',
        [Facet.source]: 'properties_aggregated.ccm:replicationsource',
        [Facet.type]: 'properties_aggregated.ccm:objecttype',
        [Facet.editorialTag]: 'collections.properties.ccm:collectiontype.keyword',
    };
    readonly simpleFilters: { [key in SimpleFilter]: Query } = {
        [SimpleFilter.oer]: oerMapping.getFilter(),
    };
    readonly collectionsFieldPrefix = 'collections.';
    readonly mapFilterTerms: MapFilterTerms;
    readonly mapFacetBuckets: MapFacetBuckets;
    readonly collectionsMapping = new CollectionsMapping();
    private readonly commonMapper = new CommonMapper(customTermsMaps);

    constructor() {
        this.mapFilterTerms = this.commonMapper.mapFilterTerms.bind(this.commonMapper);
        this.mapFacetBuckets = this.commonMapper.mapFacetBuckets.bind(this.commonMapper);
    }

    mapId(hit: EduSharingHit): string {
        return hit._source.nodeRef.id;
    }

    mapHit(hit: EduSharingHit, language: Language | null): Hit {
        const source = hit._source;
        return {
            id: this.mapId(hit),
            lom: {
                general: {
                    title: source.properties['cclom:title'] || source.properties['cm:name'],
                    description: source.properties['cclom:general_description']?.[0],
                    language: source.properties['cclom:general_language'],
                },
                technical: {
                    location:
                        source.properties['ccm:wwwurl'] ||
                        this.mapLocation(source.properties['cclom:location'][0]),
                    duration: source.properties['cclom:duration']
                        ? parseInt(source.properties['cclom:duration'], 10)
                        : undefined,
                    format: source.content?.mimetype,
                },
                lifecycle: {
                    contribute: contributeMapping.mapContribute(hit),
                },
            },
            skos: {
                discipline: hit.fields['properties_aggregated.ccm:taxonid']
                    ?.filter((entry, index, self) => self.indexOf(entry) === index)
                    .map((entry) => this.mapSkos(Facet.discipline, entry, language)),
                educationalContext: hit.fields['properties_aggregated.ccm:educationalcontext']
                    ?.filter((entry, index, self) => self.indexOf(entry) === index)
                    .map((entry) => this.mapSkos(Facet.educationalContext, entry, language)),
                learningResourceType: hit.fields[
                    'properties_aggregated.ccm:educationallearningresourcetype'
                ]
                    ?.filter((entry, index, self) => self.indexOf(entry) === index)
                    .map((entry) => this.mapSkos(Facet.learningResourceType, entry, language)),
                intendedEndUserRole: hit.fields[
                    'properties_aggregated.ccm:educationalintendedenduserrole'
                ]
                    ?.filter((entry, index, self) => self.indexOf(entry) === index)
                    .map((entry) => this.mapSkos(Facet.intendedEndUserRole, entry, language)),
                conditionsOfAccess: hit.fields['properties_aggregated.ccm:conditionsOfAccess']
                    ?.filter((entry, index, self) => self.indexOf(entry) === index)
                    .map((entry) => this.mapSkos('conditionsOfAccess', entry, language)),
                price: hit.fields['properties_aggregated.ccm:price']
                    ?.filter((entry, index, self) => self.indexOf(entry) === index)
                    .map((entry) => this.mapSkos('price', entry, language)),
                widgets: hit.fields['properties_aggregated.ccm:oeh_widgets']
                    ?.filter((entry, index, self) => self.indexOf(entry) === index)
                    .map((entry) => this.mapSkos('widgets', entry, language)),
                containsAdvertisement: hit.fields['properties_aggregated.ccm:containsAdvertisement']
                    ?.filter((entry, index, self) => self.indexOf(entry) === index)
                    .map((entry) => this.mapSkos('containsAdvertisement', entry, language)),
            },
            type: source.properties['ccm:objecttype']
                ? (this.commonMapper.map(
                      Facet.type,
                      source.properties['ccm:objecttype'],
                      language,
                  ) as Type)
                : Type.content,
            source: {
                id: source.properties['ccm:replicationsource'] ?? VALUE_NOT_AVAILABLE,
                name: this.commonMapper.map(
                    Facet.source,
                    source.properties['ccm:replicationsource'] ?? VALUE_NOT_AVAILABLE,
                    language,
                ),
                url:
                    sourceUrls[source.properties['ccm:replicationsource'] ?? VALUE_NOT_AVAILABLE] ??
                    '',
            },
            license: {
                oer: oerMapping.getValue(hit),
                displayName: licenseMapping.getDisplayName(hit, language),
            },
            editorialTags: source.collections?.some(
                (collection) => collection.properties['ccm:collectiontype'],
            )
                ? // This fallback to the value of `ccm:collectiontype` for collection types other
                  // than 'EDITORIAL'...
                  (this.commonMapper
                      .mapArray(
                          Facet.editorialTag,
                          source.collections
                              .map((collections) => collections.properties['ccm:collectiontype'])
                              .filter((collectionType) => collectionType !== undefined) as string[],
                          language,
                      )
                      // ...so we filter those out.
                      //
                      // TODO: Find a solution that allows discarding unmapped values.
                      .filter((tag) =>
                          Object.values(EditorialTag).includes(tag as EditorialTag),
                      ) as EditorialTag[])
                : [],
            previewImage: {
                thumbnail: source.preview
                    ? {
                          __typename: 'EmbeddedThumbnail',
                          image: source.preview.small,
                          mimetype: source.preview.mimetype ?? 'image/*',
                      }
                    : {
                          __typename: 'ExternalThumbnail',
                          url: this.getPreviewUrl(source, { size: 'thumbnail' }),
                      },
                url: this.getPreviewUrl(source, { size: 'original' }),
            },
            misc: {
                author: miscMapping.mapAuthor(hit),
                isExternal: miscMapping.mapIsExternal(hit),
            },
        };
    }

    getIdQuery(id: string) {
        return { term: { 'nodeRef.id': id } };
    }

    getSources(fields: any) {
        return {
            excludes: [
                'i18n',
                'content.fulltext',
                ...(fields.hits?.previewImage?.thumbnail ? [] : ['preview']),
            ],
        };
    }
    getStoredFields() {
        return ['properties_aggregated.*'];
    }

    getSearchQueryFields(language: Language | null): string[] {
        const result = [
            'properties.cclom:title^3',
            'properties.cm:name',
            'collections.properties.cm:name',
            'properties.cclom:general_keyword',
            'collections.properties.cclom:general_keyword',
            'properties.cclom:general_description',
            'collections.properties.cclom:general_description',
            'content.fulltext',
        ];
        if (language) {
            result.push(`i18n.${this.getI18nLanguage(language)}.*`);
            result.push(`collections.i18n.${this.getI18nLanguage(language)}.*`);
        }
        return result;
    }

    getShouldTerms() {
        return {
            'collections.properties.ccm:collectiontype.keyword': ['EDITORIAL'],
            boost: 1,
        };
    }

    getAutoCompleteConfig() {
        return {
            source: { includes: ['properties.cclom:title'] },
            mapHit: (hit: EduSharingHit) => hit._source.properties['cclom:title'] ?? '',
            queryFields: ['properties.cclom:title'],
        };
    }

    getDidYouMeanSuggestionField(): string {
        return 'properties.cclom:title';
    }

    getStaticFilters(): Query[] {
        return [
            { terms: { type: ['ccm:io'] } },
            { terms: { 'permissions.read': ['GROUP_EVERYONE'] } },
            { terms: { 'properties.cm:edu_metadataset': ['mds_oeh'] } },
            { terms: { 'nodeRef.storeRef.protocol': ['workspace'] } },
        ];
    }

    getStaticNegativeFilters(): Query[] {
        return [
            { term: { aspects: 'ccm:collection_io_reference' } },
            { term: { aspects: 'ccm:io_childobject' } },
        ];
    }

    getInternationalizedFacetFields(facet: Facet, language: Language): string[] | null {
        const locale = this.getI18nLanguage(language);
        switch (facet) {
            case Facet.discipline:
                return [`i18n.${locale}.ccm:taxonid`, `collections.i18n.${locale}.ccm:taxonid`];
            case Facet.learningResourceType:
                return [
                    `i18n.${locale}.ccm:educationallearningresourcetype`,
                    `collections.i18n.${locale}.ccm:educationallearningresourcetype`,
                ];
            case Facet.educationalContext:
                return [
                    `i18n.${locale}.ccm:educationalcontext`,
                    `collections.i18n.${locale}.ccm:educationalcontext`,
                ];
            case Facet.intendedEndUserRole:
                return [
                    `i18n.${locale}.ccm:educationalintendedenduserrole`,
                    `collections.i18n.${locale}.ccm:educationalintendedenduserrole`,
                ];
            case Facet.keyword:
                return ['properties.cclom:general_keyword'];
            case Facet.type:
                return [
                    `i18n.${locale}.ccm:objecttype`,
                    `collections.i18n.${locale}.ccm:objecttype`,
                ];
            case Facet.editorialTag:
                return null;
            case Facet.source:
                return [`i18n.${locale}.ccm:replicationsource`];
        }
    }

    private mapSkos(vocabsScheme: VocabsScheme, id: string, language: Language | null): SkosEntry {
        return {
            id,
            label: this.commonMapper.map(vocabsScheme, id, language),
        };
    }

    private getPreviewUrl(source: Source, { size }: { size: 'original' | 'thumbnail' }) {
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

    private getI18nLanguage(language: Language) {
        switch (language) {
            case Language.de:
                return 'de_DE';
            case Language.en:
                return 'en_US';
        }
    }

    private mapLocation(location: string): string {
        if (location.startsWith(EduSharingMapping.LOCATION_LOCAL_PREFIX)) {
            const id = location.substr(EduSharingMapping.LOCATION_LOCAL_PREFIX.length);
            return `${config.eduSharing.url}/components/render/${id}`;
        }
        return location;
    }
}
