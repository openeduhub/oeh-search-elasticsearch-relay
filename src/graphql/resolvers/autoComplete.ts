import { getFilter } from '../common/filter';
import { QueryResolvers } from '../../generated/graphql';
import { client } from '../../common/elasticSearchClient';
import { mapping } from '../../mapping';

const autoCompleteConfig = mapping.getAutoCompleteConfig();

const autoCompleteResolver: QueryResolvers['autoComplete'] = async (
    root,
    args,
    context,
    info,
): Promise<string[]> => {
    if (autoCompleteConfig === null) {
        return [];
    }
    const { body } = await client.search({
        body: {
            _source: autoCompleteConfig.source,
            query: {
                bool: {
                    must: {
                        multi_match: {
                            query: args.searchString,
                            type: 'bool_prefix',
                            fields: autoCompleteConfig.queryFields,
                            operator: 'and',
                        },
                    },
                    must_not: mapping.getStaticNegativeFilters(),
                    filter: getFilter(args.filters ?? null, args.language ?? null, false),
                },
            },
        },
    });
    return parseResponse(body);
};

function parseResponse(body: any): string[] {
    return body.hits.hits.map((hit: any) => autoCompleteConfig?.mapHit(hit._source));
}

export default autoCompleteResolver;
