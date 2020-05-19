import { QueryResolvers } from '../generated/graphql';
import autoComplete from './autoComplete';
import didYouMeanSuggestion from './didYouMeanSuggestion';
import facets from './facets';
import get from './get';
import search from './search';

const Query: QueryResolvers = {
    autoComplete,
    didYouMeanSuggestion,
    facets,
    get,
    search,
};

export default { Query };
