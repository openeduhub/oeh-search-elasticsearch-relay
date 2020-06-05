import graphqlFields from 'graphql-fields';
import { client } from '../elasticSearchClient';
import {
    Bucket,
    QueryResolvers,
    SubjectsPortalDiscipline,
    SubjectsPortals,
    Language,
} from '../generated/graphql';
import { vocab, Vocab } from '../utils/vocab';
import { config } from '../config';

type EducationalContext = Exclude<keyof SubjectsPortals, '__typename'>;

const subjectsPortalsResolver: QueryResolvers['subjectsPortals'] = async (
    root,
    args,
    context,
    info,
): Promise<SubjectsPortals> => {
    if (!vocab.isInitialized()) {
        await vocab.init();
    }
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
                'valuespaces.educationalContext.key.keyword':
                    'https://w3id.org/openeduhub/vocabs/educationalContext/' + educationalContext,
            },
        },
        aggregations: {
            disciplines: {
                terms: {
                    field: 'valuespaces.discipline.key.keyword',
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
    const match = bucket.key.match(/^https:\/\/w3id.org\/openeduhub\/vocabs\/discipline\/(\S+)$/);
    if (!match) {
        throw new Error('Unexpected key in disciplines buckets');
    }
    const id = match[1];
    return {
        doc_count: bucket.doc_count,
        id,
        // featured_doc_count: 0,
        url: `${config.frontend.url}/${getUrlLanguageFragment(
            language,
        )}/search/${encodeURIComponent(
            vocab.get(Vocab.educationalContext, educationalContext)[language],
        )}/${encodeURIComponent(vocab.get(Vocab.discipline, id)[language])}`,
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
