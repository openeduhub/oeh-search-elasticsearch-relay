import { Args, Query, Resolver } from '@nestjs/graphql';
import { Max } from 'class-validator';
import { Aggregation, Facet, Filter, Language } from '../graphql';
import { FacetsResolver } from './facets.resolver';

class FacetArgs {
    facet!: Facet;
    @Max(100) size!: number;
    searchString?: string;
    filters?: Filter[];
    language?: Language;
    skipOutputMapping?: boolean;
}

@Resolver()
export class FacetResolver {
    @Query()
    async facet(@Args() args: FacetArgs): Promise<Aggregation> {
        const result = await new FacetsResolver().facets({
            facets: [args.facet],
            size: args.size,
            searchString: args.searchString,
            filters: args.filters,
            language: args.language,
            skipOutputMapping: args.skipOutputMapping,
        });
        if (result.length !== 1) {
            throw new Error('Failed to resolver returned an array of size != 1');
        }
        return result[0];
    }
}
