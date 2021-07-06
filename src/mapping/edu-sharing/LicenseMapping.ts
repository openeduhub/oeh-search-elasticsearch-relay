import { Language } from '../../graphql';
import { EduSharingHit } from './types/EduSharingHit';

class LicenseMapping {
    private readonly displayNames: { [language in Language]: { [key: string]: string } } = {
        de: {
            NONE: 'Keine oder unbekannte Lizenz',
            MULTI: 'Unterschiedliche Lizenzen',
            COPYRIGHT_FREE: 'Copyright, freier Zugang',
            COPYRIGHT_LICENSE: 'Copyright, lizenzpflichtig',
            SCHULFUNK: 'Schulfunk (§47 UrhG)',
            UNTERRICHTS_UND_LEHRMEDIEN: '§60b Unterrichts- und Lehrmedien',
            CC_0: 'CC-0',
            PDM: 'PDM',
            CC_BY: 'CC-BY',
            CC_BY_SA: 'CC-BY-SA',
            CC_BY_NC: 'CC-BY-NC',
            CC_BY_ND: 'CC-BY-ND',
            CC_BY_NC_SA: 'CC-BY-NC-SA',
            CC_BY_NC_ND: 'CC-BY-NC-ND',
            CUSTOM: 'Andere Lizenz',
        },
        en: {
            NONE: 'No or unknown license',
            MULTI: 'Multiple licenses',
            COPYRIGHT_FREE: 'Copyright, free access',
            COPYRIGHT_LICENSE: 'Copyright, subject to licensing',
            SCHULFUNK: 'German educational radio/television license (§47 UrhG)',
            UNTERRICHTS_UND_LEHRMEDIEN: '§60b Unterrichts- und Lehrmedien',
            CC_0: 'CC-0',
            PDM: 'PDM',
            CC_BY: 'CC-BY',
            CC_BY_SA: 'CC-BY-SA',
            CC_BY_NC: 'CC-BY-NC',
            CC_BY_ND: 'CC-BY-ND',
            CC_BY_NC_SA: 'CC-BY-NC-SA',
            CC_BY_NC_ND: 'CC-BY-NC-ND',
            CUSTOM: 'Custom license',
        },
    };

    getDisplayName(hit: EduSharingHit, language: Language | null): string | undefined {
        const key = hit.fields['properties_aggregated.ccm:commonlicense_key']?.[0];
        const customLicenseString = hit._source.properties['cclom:rights_description'];
        if (!key) {
            return undefined;
        } else if (key === 'CUSTOM' && customLicenseString) {
            return customLicenseString;
        } else if (language && this.displayNames[language][key]) {
            return this.displayNames[language][key];
        } else {
            return key;
        }
    }
}

export const licenseMapping = new LicenseMapping();
