import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { client } from 'src/common/elasticSearchClient';
import { mapping } from 'src/mapping';
import { Collection } from '../graphql';

@Resolver('Collection')
export class CollectionResolver {
    @ResolveField()
    async numberElements(@Parent() collection: Collection): Promise<number> {
        const { body } = await client.search({
            body: {
                size: 0,
                track_total_hits: true,
                query: mapping.collectionsMapping.getIdQuery(collection.id),
            },
        });
        return body.hits.total.value;
    }
}
