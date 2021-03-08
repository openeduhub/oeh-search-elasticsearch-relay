import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { LogRequestsPlugin } from './common/logRequests';
import { AutoCompleteResolvers } from './resolvers/autoComplete.resolver';
import { FacetResolver } from './resolvers/facet.resolver';
import { FacetsResolver } from './resolvers/facets.resolver';
import { FacetSuggestionsResolver } from './resolvers/facetSuggestions';
import { GetResolver } from './resolvers/get';
import { SearchResolver } from './resolvers/search.resolver';
import { SubjectsPortalsResolver } from './resolvers/subjectsPortals';

@Module({
    imports: [
        ConfigModule.forRoot(),
        GraphQLModule.forRoot({
            // debug: true,
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
        SearchResolver,
        SubjectsPortalsResolver,
        LogRequestsPlugin,
    ],
})
export class AppModule {}
