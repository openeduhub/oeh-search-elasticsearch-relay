import { Args, Query, Resolver } from '@nestjs/graphql';
import { Aggregation, Facet, Filter, Language } from '../graphql';
import { FacetsResolver } from './facets.resolver';

@Resolver()
export class FacetResolver {
    @Query()
    async facet(
        @Args('facet') facet: Facet,
        @Args('size') size: number,
        @Args('searchString') searchString?: string,
        @Args('filters') filters?: Filter[],
        @Args('language') language?: Language,
        @Args('skipOutputMapping') skipOutputMapping?: boolean,
    ): Promise<Aggregation> {
        const result = await new FacetsResolver().facets(
            [facet],
            size,
            searchString,
            filters,
            language,
            skipOutputMapping,
        );
        if (result.length !== 1) {
            throw new Error('Failed to resolver returned an array of size != 1');
        }
        return result[0];
    }
}
