import { Args, Info, Query, Resolver } from '@nestjs/graphql';
import graphqlFields from 'graphql-fields';
import { config } from '../common/config';
import { client } from '../common/elasticSearchClient';
import { vocabs } from '../common/vocabs';
import { Bucket, Facet, Language, SubjectsPortalDiscipline, SubjectsPortals } from '../graphql';
import { mapping } from '../mapping';

type EducationalContext = Exclude<keyof SubjectsPortals, '__typename'>;

@Resolver()
export class SubjectsPortalsResolver {
    @Query()
    async subjectsPortals(
        @Args('size') size: number,
        @Args('language') language: Language,
        @Info() info: any,
    ): Promise<SubjectsPortals> {
        const fields = graphqlFields(info);
        const educationalContexts = Object.keys(fields);
        const requestBody = {
            body: {
                size: 0,
                aggregations: generateAggregations(educationalContexts, size),
            },
        };
        const { body } = await client.search(requestBody);
        return parseResponse(body, language);
    }
}

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
                [mapping.facetFields[Facet.educationalContext]]: vocabs.keyToId(
                    Facet.educationalContext,
                    educationalContext,
                ),
            },
        },
        aggregations: {
            disciplines: {
                terms: {
                    field: mapping.facetFields[Facet.discipline],
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
    const educationalContextId = vocabs.keyToId(Facet.educationalContext, educationalContext);
    const key = vocabs.idToKey(Facet.discipline, bucket.key);
    return {
        doc_count: bucket.doc_count,
        id: key,
        // featured_doc_count: 0,
        url: `${config.frontend.url}/${getUrlLanguageFragment(
            language,
        )}/search/${encodeURIComponent(
            vocabs.getLabel(Facet.educationalContext, educationalContextId, language),
        )}/${encodeURIComponent(vocabs.getLabel(Facet.discipline, bucket.key, language))}`,
    };
}

function getUrlLanguageFragment(language: Language) {
    if (config.production) {
        switch (language) {
            case Language.de:
                return 'de';
            case Language.en:
                return 'en-US';
        }
    } else {
        return '';
    }
}
