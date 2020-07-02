import { Aggregation, QueryResolvers } from '../../generated/graphql';
import facetsResolver from './facets';

const facetResolver: QueryResolvers['facet'] = async (
    root,
    args,
    context,
    info,
): Promise<Aggregation> => {
    if (typeof facetsResolver !== 'function') {
        throw new Error('facetsResolver is not a function');
    }
    const result = await facetsResolver(
        root,
        {
            facets: [args.facet],
            size: args.size,
            language: args.language,
            searchString: args.searchString,
            filters: args.filters,
        },
        context,
        info,
    );
    if (result.length !== 1) {
        throw new Error('Failed to resolver returned an array of size != 1');
    }
    return result[0];
};

export default facetResolver;
