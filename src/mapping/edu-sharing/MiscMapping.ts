import { EduSharingHit } from './types/EduSharingHit';

class MiscMapping {
    mapAuthor(hit: EduSharingHit): string | undefined {
        const author = hit.fields['properties_aggregated.ccm:author_freetext']?.[0];
        return author || undefined;
    }

    mapIsExternal(hit: EduSharingHit): boolean {
        return !!hit._source.properties['ccm:wwwurl'];
    }
}

export const miscMapping = new MiscMapping();
