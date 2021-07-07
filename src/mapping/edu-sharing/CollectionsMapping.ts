import { Collection } from 'src/graphql';
import { EduSharingHit } from './types/EduSharingHit';

type extractGeneric<Type> = Type extends Array<infer X> ? X : never;
type SourceCollection = extractGeneric<EduSharingHit['_source']['collections']>;

export class CollectionsMapping {
    getIdQuery(id: string) {
        return { term: { 'collections.nodeRef.id.keyword': id } };
    }

    filterPredicate(sourceCollection: SourceCollection): boolean {
        return sourceCollection.permissions.read.includes('GROUP_EVERYONE');
    }

    mapCollection(sourceCollection: SourceCollection): Partial<Collection> {
        return {
            id: sourceCollection.nodeRef.id,
            name: sourceCollection.properties['cm:name'],
            url: sourceCollection.properties['cclom:location'][0],
            thumbnail: {
                mimetype: sourceCollection.preview.mimetype as string,
                image: sourceCollection.preview.small,
            },
        };
    }
}
