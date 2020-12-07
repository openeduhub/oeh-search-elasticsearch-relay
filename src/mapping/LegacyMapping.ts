import { config } from '../common/config';
import { VocabsScheme } from '../common/vocabs';
import { EditorialTag, Facet, Hit, Language, SkosEntry, Type } from '../generated/graphql';
import { CommonMapper } from './common/CommonMapper';
import { CustomTermsMaps } from './common/CustomTermsMap';
import { Mapping, MapFilterTerms, MapFacetBuckets } from './Mapping';
import { InternationalString, LegacyHit, OerType } from './types/LegacyHit';

export const VALUE_NOT_AVAILABLE = 'N/A';

const customTermsMaps: CustomTermsMaps = {
    [Facet.Oer]: {
        type: 'one-to-many',
        map: {
            true: [OerType.All],
            false: [OerType.Mixed, OerType.None, VALUE_NOT_AVAILABLE],
        },
    },
    [Facet.Type]: {
        type: 'one-to-many',
        map: {
            [Type.Content]: ['MATERIAL'],
            [Type.Portal]: ['SOURCE'],
            [Type.Tool]: ['TOOL'],
            [Type.LessonPlanning]: ['LESSONPLANNING'],
        },
    },
    [Facet.EditorialTag]: {
        type: 'one-to-many',
        map: {
            [EditorialTag.Recommended]: ['EDITORIAL', 'FEATURED'],
        },
    },
};

export class LegacyMapping implements Mapping<LegacyHit> {
    readonly facetFields: { [facet in Facet]: string } = {
        [Facet.Discipline]: `valuespaces.discipline.key.keyword`,
        [Facet.LearningResourceType]: `valuespaces.learningResourceType.key.keyword`,
        [Facet.EducationalContext]: `valuespaces.educationalContext.key.keyword`,
        [Facet.IntendedEndUserRole]: `valuespaces.intendedEndUserRole.key.keyword`,
        [Facet.Keyword]: 'lom.general.keyword.keyword',
        [Facet.Source]: 'source.name.keyword',
        [Facet.Oer]: 'license.oer',
        [Facet.Type]: 'type',
        [Facet.EditorialTag]: 'collection.uuid',
    };
    readonly mapFilterTerms: MapFilterTerms;
    readonly mapFacetBuckets: MapFacetBuckets;
    private readonly commonMapper = new CommonMapper(customTermsMaps);

    constructor() {
        this.mapFilterTerms = this.commonMapper.mapFilterTerms.bind(this.commonMapper);
        this.mapFacetBuckets = this.commonMapper.mapFacetBuckets.bind(this.commonMapper);
    }

    mapHit(source: LegacyHit, language: Language | null): Hit {
        return {
            id: source.id,
            // Fall back to educational.description if general.description is not defined.
            lom: {
                ...source.lom,
                general: {
                    description: source.lom.educational?.description,
                    ...source.lom.general,
                },
            },
            skos: {
                discipline: source.valuespaces?.discipline?.map((entry) =>
                    this.mapSkos(Facet.Discipline, entry, language),
                ),
                educationalContext: source.valuespaces?.educationalContext?.map((entry) =>
                    this.mapSkos(Facet.EducationalContext, entry, language),
                ),
                learningResourceType: source.valuespaces?.learningResourceType?.map((entry) =>
                    this.mapSkos(Facet.LearningResourceType, entry, language),
                ),
                intendedEndUserRole: source.valuespaces?.intendedEndUserRole?.map((entry) =>
                    this.mapSkos(Facet.IntendedEndUserRole, entry, language),
                ),
            },
            type: this.commonMapper.map(Facet.Type, source.type, language) as Type,
            source: source.source,
            license: {
                oer:
                    this.commonMapper.map(
                        Facet.Oer,
                        source.license?.oer ?? VALUE_NOT_AVAILABLE,
                        language,
                    ) === 'true',
            },
            editorialTags: source.collection
                ? (this.commonMapper.mapArray(
                      Facet.EditorialTag,
                      source.collection.map((collection) => collection.uuid),
                      language,
                  ) as EditorialTag[])
                : [],
            previewImage: {
                thumbnail: {
                    __typename: 'EmbeddedThumbnail',
                    mimetype: source.thumbnail.mimetype,
                    image: source.thumbnail.small,
                },
                url: `${config.url}/rest/entry/${source.id}/thumbnail`,
            },
        };
    }

    getIdQuery(id: string) {
        return { term: { _id: id } };
    }

    getSources() {
        return {
            excludes: ['thumbnail.large', 'fulltext'],
        };
    }

    getSearchQueryFields(language: Language | null): string[] {
        const result = [
            'lom.general.title^3',
            'lom.general.keyword',
            'lom.general.description',
            'fulltext',
        ];
        if (language) {
            result.push(`valuespaces.*.${language}`);
        }
        return result;
    }

    getShouldTerms() {
        return {
            'collection.uuid': ['EDITORIAL', 'FEATURED'],
            boost: 1,
        };
    }

    getAutoCompleteConfig() {
        return {
            source: { includes: ['lom.general.title'] },
            mapHit: (hit: LegacyHit) => hit.lom.general.title,
            queryFields: [
                'lom.general.title.search_as_you_type',
                'lom.general.title.search_as_you_type._2gram',
                'lom.general.title.search_as_you_type._3gram',
                'lom.general.title.search_as_you_type._index_prefix',
            ],
        };
    }

    getDidYouMeanSuggestionField(): string {
        return 'lom.general.title';
    }

    getStaticFilters() {
        return [];
    }

    getStaticNegativeFilters() {
        return [];
    }

    private mapSkos(
        vocabsScheme: VocabsScheme,
        internationalString: InternationalString,
        language: Language | null,
    ): SkosEntry {
        return {
            id: internationalString.key,
            label: this.commonMapper.map(vocabsScheme, internationalString.key, language),
        };
    }
}
