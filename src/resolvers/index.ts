import { QueryResolvers } from '../generated/graphql';
import autoComplete from './autoComplete';
import didYouMeanSuggestion from './didYouMeanSuggestion';
import facets from './facets';
import get from './get';
import search from './search';
import subjectsPortals from './subjectsPortals';

const Query: QueryResolvers = {
    autoComplete,
    didYouMeanSuggestion,
    facets,
    get,
    search,
    subjectsPortals,
};

export default { Query };
