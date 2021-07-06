import { LomContribute } from 'src/graphql';
import { EduSharingHit } from './types/EduSharingHit';

class ContributeMapping {
    readonly rolePrefix = 'ccm:lifecyclecontributer_';

    mapContribute(hit: EduSharingHit): LomContribute[] | undefined {
        if (!hit._source.contributor) {
            return undefined;
        }
        const contributes = hit._source.contributor
            .filter((contributor) => contributor.property.startsWith(this.rolePrefix))
            .map((contributor) => ({
                role: contributor.property.slice(this.rolePrefix.length),
                entity: contributor.vcard,
            }));
        if (contributes.length > 0) {
            return contributes;
        } else {
            return undefined;
        }
    }
}

export const contributeMapping = new ContributeMapping();
