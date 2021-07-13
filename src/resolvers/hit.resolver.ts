import { Context, Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { mapping, SourceHit } from 'src/mapping';
import { Collection, Hit } from '../graphql';

@Resolver('Hit')
export class HitResolver {
    @ResolveField()
    collections(@Parent() hit: Hit, @Context() context: any): Partial<Collection>[] | null {
        const sourceHit: SourceHit = context.rootResponseBody.hits.hits.find(
            (sourceHits: SourceHit) => hit.id === mapping.mapId(sourceHits),
        );
        const sourceCollections = sourceHit._source.collections;
        const collections = sourceCollections
            ?.filter((sourceCollection) =>
                mapping.collectionsMapping.filterPredicate(sourceCollection),
            )
            .map((sourceCollection) => mapping.collectionsMapping.mapCollection(sourceCollection));
        if (collections.length > 0) {
            return collections;
        } else {
            return null;
        }
    }
}
