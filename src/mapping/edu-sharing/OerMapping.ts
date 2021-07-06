import { Query } from 'elastic-ts';
import { CommonLicenseKey, EduSharingHit, Fields } from './types/EduSharingHit';

export const oerMapping = new (class OerMapping {
    /** @internal */
    readonly sufficientValues: Array<{ field: keyof Fields; terms: string[] }> = [
        {
            field: 'properties_aggregated.ccm:commonlicense_key',
            terms: [
                CommonLicenseKey.CC_0,
                CommonLicenseKey.CC_BY,
                CommonLicenseKey.CC_BY_SA,
                CommonLicenseKey.PDM,
            ],
        },
        {
            field: 'properties_aggregated.ccm:license_oer',
            terms: ['http://w3id.org/openeduhub/vocabs/oer/0'],
        },
    ];

    getFilter(): Query {
        return {
            bool: {
                should: this.sufficientValues.map((sufficientValue) => ({
                    terms: {
                        [sufficientValue.field]: sufficientValue.terms,
                    },
                })),
            },
        };
    }

    getValue(hit: EduSharingHit): boolean {
        return this.sufficientValues.some((sufficientValue) =>
            hit.fields[sufficientValue.field]?.some((term) => sufficientValue.terms.includes(term)),
        );
    }
})();
