import {
    Bucket,
    QueryResolvers,
    SubjectsPortalDiscipline,
    SubjectsPortals,
    Language,
    Facet,
} from '../../generated/graphql';
import { client } from '../../common/elasticSearchClient';
import { config } from '../../common/config';
import { vocabs } from '../../common/vocabs';
import graphqlFields from 'graphql-fields';
import { mapping } from '../../mapping';

type EducationalContext = Exclude<keyof SubjectsPortals, '__typename'>;

const subjectsPortalsResolver: QueryResolvers['subjectsPortals'] = async (
    root,
    args,
    context,
    info,
): Promise<SubjectsPortals> => {
    const fields = graphqlFields(info as any);
    const educationalContexts = Object.keys(fields);
    const requestBody = {
        body: {
            size: 0,
            aggregations: generateAggregations(educationalContexts, args.size),
        },
    };
    const { body } = await client.search(requestBody);
    return parseResponse(body, args.language);
};

function generateAggregations(educationalContexts: string[], size: number) {
    return educationalContexts.reduce((acc, educationalContext) => {
        acc[educationalContext] = generateSubjectsPortalAggregation(educationalContext, size);
        return acc;
    }, {} as { [key: string]: ReturnType<typeof generateSubjectsPortalAggregation> });
}

function generateSubjectsPortalAggregation(educationalContext: string, size: number) {
    return {
        filter: {
            term: {
                [mapping.facetFields[Facet.EducationalContext]]: vocabs.keyToId(
                    Facet.EducationalContext,
                    educationalContext,
                ),
            },
        },
        aggregations: {
            disciplines: {
                terms: {
                    field: mapping.facetFields[Facet.Discipline],
                    size,
                },
            },
        },
    };
}

function parseResponse(body: any, language: Language): SubjectsPortals {
    return Object.entries(body.aggregations).reduce((acc, [key, value]) => {
        acc[key as EducationalContext] = generateSubjectsPortalDisciplines(
            key as EducationalContext,
            (value as any).disciplines.buckets,
            language,
        );
        return acc;
    }, {} as SubjectsPortals);
}

function generateSubjectsPortalDisciplines(
    educationalContext: EducationalContext,
    buckets: Bucket[],
    language: Language,
): SubjectsPortalDiscipline[] {
    return buckets.map((bucket: Bucket) =>
        generateSubjectsPortalDiscipline(educationalContext, bucket, language),
    );
}

function generateSubjectsPortalDiscipline(
    educationalContext: EducationalContext,
    bucket: Bucket,
    language: Language,
): SubjectsPortalDiscipline {
    const educationalContextId = vocabs.keyToId(Facet.EducationalContext, educationalContext);
    const key = vocabs.idToKey(Facet.Discipline, bucket.key);
    return {
        doc_count: bucket.doc_count,
        id: key,
        // featured_doc_count: 0,
        url: `${config.frontend.url}/${getUrlLanguageFragment(
            language,
        )}/search/${encodeURIComponent(
            vocabs.getLabel(Facet.EducationalContext, educationalContextId, language),
        )}/${encodeURIComponent(vocabs.getLabel(Facet.Discipline, bucket.key, language))}`,
    };
}

function getUrlLanguageFragment(language: Language) {
    if (config.production) {
        switch (language) {
            case Language.De:
                return 'de';
            case Language.En:
                return 'en-US';
        }
    } else {
        return '';
    }
}

export default subjectsPortalsResolver;
