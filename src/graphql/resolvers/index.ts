import { QueryResolvers, Thumbnail } from '../../generated/graphql';
import autoComplete from './autoComplete';
import didYouMeanSuggestion from './didYouMeanSuggestion';
import facet from './facet';
import facets from './facets';
import facetSuggestions from './facetSuggestions';
import get from './get';
import search from './search';
import subjectsPortals from './subjectsPortals';

const Query: QueryResolvers = {
    autoComplete,
    didYouMeanSuggestion,
    facet,
    facets,
    facetSuggestions,
    get,
    search,
    subjectsPortals,
};

export default {
    Query,
    Thumbnail: {
        __resolveType(obj: Thumbnail) {
            return obj.__typename;
        },
    },
};
