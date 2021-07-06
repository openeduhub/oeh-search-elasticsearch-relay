import { EduSharingHit } from './types/EduSharingHit';

class MiscMapping {
    mapAuthor(hit: EduSharingHit): string | undefined {
        const author = hit.fields['properties_aggregated.ccm:author_freetext']?.[0];
        return author || undefined;
    }
}

export const miscMapping = new MiscMapping();
