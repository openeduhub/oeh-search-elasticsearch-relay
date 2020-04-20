import { QueryResolvers } from 'src/generated/graphql';
import search from './search';
import get from './get';
import autoComplete from './autoComplete';

const Query: QueryResolvers = {
    search,
    get,
    autoComplete,
};

export default { Query };
