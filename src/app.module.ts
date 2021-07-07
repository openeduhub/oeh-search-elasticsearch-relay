import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { config } from './common/config';
import { LogRequestsPlugin } from './common/logRequests';
import { AutoCompleteResolvers } from './resolvers/autoComplete.resolver';
import { CollectionResolver } from './resolvers/collection.resolver';
import { FacetResolver } from './resolvers/facet.resolver';
import { FacetsResolver } from './resolvers/facets.resolver';
import { FacetSuggestionsResolver } from './resolvers/facetSuggestions.resolver';
import { GetResolver } from './resolvers/get.resolver';
import { HitResolver } from './resolvers/hit.resolver';
import { SearchResolver } from './resolvers/search.resolver';
import { SubjectsPortalsResolver } from './resolvers/subjectsPortals.resolver';

@Module({
    imports: [
        ConfigModule.forRoot(),
        GraphQLModule.forRoot({
            debug: !config.production,
            introspection: true,
            playground: true,
            typePaths: ['./**/*.graphql'],
        }),
    ],
    providers: [
        AutoCompleteResolvers,
        FacetResolver,
        FacetsResolver,
        FacetSuggestionsResolver,
        GetResolver,
        HitResolver,
        CollectionResolver,
        SearchResolver,
        SubjectsPortalsResolver,
        LogRequestsPlugin,
    ],
})
export class AppModule {}
