import { merge } from 'lodash';
import { oerMapping } from './EduSharingMapping';
import { EduSharingHit } from './types/EduSharingHit';

describe('EduSharingMapping', () => {
    let dummyHit: EduSharingHit;

    beforeEach(async () => {
        dummyHit = {
            _source: {
                aspects: [],
                collections: [],
                content: { fulltext: '' },
                nodeRef: { id: '', storeRef: { protocol: 'workspace', identifier: 'SpacesStore' } },
                permissions: { read: '' },
                preview: {
                    small: '',
                },
                properties: {
                    'cclom:location': [],
                    'cm:name': '',
                },
                type: '',
            },
            fields: {},
        };
    });

    describe('OerMapping', () => {
        it('should return correct filter', () => {
            expect(oerMapping.getFilter()).toStrictEqual({
                bool: {
                    should: [
                        {
                            terms: {
                                'properties_aggregated.ccm:commonlicense_key': [
                                    'CC_0',
                                    'CC_BY',
                                    'CC_BY_SA',
                                    'PDM',
                                ],
                            },
                        },
                        {
                            terms: {
                                'properties_aggregated.ccm:license_oer': [
                                    'http://w3id.org/openeduhub/vocabs/oer/0',
                                ],
                            },
                        },
                    ],
                },
            });
        });

        it('should return false when no license information are available', () => {
            expect(oerMapping.getValue(dummyHit)).toBe(false);
        });

        it('should return false when commonlicinse_key is something unknown', () => {
            expect(
                oerMapping.getValue(
                    merge(dummyHit, {
                        fields: { ['properties_aggregated.ccm:commonlicense_key']: ['foo'] },
                    }),
                ),
            ).toBe(false);
        });

        it('should return true when commonlicinse_key is CC_0', () => {
            expect(
                oerMapping.getValue(
                    merge(dummyHit, {
                        fields: {
                            ['properties_aggregated.ccm:commonlicense_key']: ['CC_0'],
                        },
                    }),
                ),
            ).toBe(true);
        });

        it('should return true when commonlicinse_key is CC_BY', () => {
            expect(
                oerMapping.getValue(
                    merge(dummyHit, {
                        fields: {
                            ['properties_aggregated.ccm:commonlicense_key']: ['CC_BY'],
                        },
                    }),
                ),
            ).toBe(true);
        });

        it('should return true when license_oer is oer/0', () => {
            expect(
                oerMapping.getValue(
                    merge(dummyHit, {
                        fields: {
                            ['properties_aggregated.ccm:license_oer']: [
                                'http://w3id.org/openeduhub/vocabs/oer/0',
                            ],
                        },
                    }),
                ),
            ).toBe(true);
        });

        it('should return false when license_oer is oer/1', () => {
            expect(
                oerMapping.getValue(
                    merge(dummyHit, {
                        fields: {
                            ['properties_aggregated.ccm:license_oer']: [
                                'http://w3id.org/openeduhub/vocabs/oer/1',
                            ],
                        },
                    }),
                ),
            ).toBe(false);
        });

        it('should return false when license_oer is oer/2', () => {
            expect(
                oerMapping.getValue(
                    merge(dummyHit, {
                        fields: {
                            ['properties_aggregated.ccm:license_oer']: [
                                'http://w3id.org/openeduhub/vocabs/oer/2',
                            ],
                        },
                    }),
                ),
            ).toBe(false);
        });
    });
});
