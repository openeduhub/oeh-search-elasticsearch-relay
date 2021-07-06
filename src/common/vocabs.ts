import discipline from '../assets/vocabs/discipline.json';
import educationalContext from '../assets/vocabs/educationalContext.json';
import intendedEndUserRole from '../assets/vocabs/intendedEndUserRole.json';
import learningResourceType from '../assets/vocabs/learningResourceType.json';
import conditionsOfAccess from '../assets/vocabs/conditionsOfAccess.json';
import price from '../assets/vocabs/price.json';
import containsAdvertisement from '../assets/vocabs/containsAdvertisement.json';
import widgets from '../assets/vocabs/widgets.json';
import { Facet, Language } from '../graphql';
import { warn } from './utils';

export const vocabsSchemes = {
    [Facet.discipline]: {},
    [Facet.educationalContext]: {},
    [Facet.intendedEndUserRole]: {},
    [Facet.learningResourceType]: {},
    conditionsOfAccess: {},
    price: {},
    widgets: {},
    containsAdvertisement: {},
};

export type VocabsScheme = keyof typeof vocabsSchemes;

interface VocabsDefinition {
    id: string;
    type: string;
    hasTopConcept: DefinitionEntry[];
}

interface DefinitionEntry {
    id: string;
    prefLabel: { [language in Language]?: string };
    altLabel?: { [language in Language]?: string[] };
    narrower?: DefinitionEntry[];
}

type VocabsMap = { [key: string]: { [language in Language]: string } };
type ReverseMap = { [language in Language]: { [label: string]: string } };

/**
 * Internal data for a Vocabs scheme.
 *
 * We use the following terms:
 *  - Scheme id: e.g. "https://w3id.org/openeduhub/vocabs/intendedEndUserRole/"
 *  - Entry id: e.g. "https://w3id.org/openeduhub/vocabs/intendedEndUserRole/author"
 *  - (Entry) key: The part of a value id after its scheme id, e.g. "author"
 */
class VocabsDictionary {
    /** The root id of the scheme. */
    readonly id: string;
    /** Maps value ids to labels in all languages. */
    readonly vocabsMap: VocabsMap;
    /** Maps labels to value ids in all languages. */
    readonly reverseMap: ReverseMap;

    constructor(vocabsDefinition: VocabsDefinition) {
        this.id = vocabsDefinition.id;
        this.vocabsMap = this.generateVocabsMap(vocabsDefinition);
        this.reverseMap = this.generateReverseMap(this.vocabsMap);
    }

    private generateVocabsMap(vocabsDefinition: VocabsDefinition): VocabsMap {
        const entries = this.flattenEntries(vocabsDefinition.hasTopConcept);
        return entries.reduce((acc, entry) => {
            if (!entry.id.startsWith(vocabsDefinition.id)) {
                throw new Error('Unexpected vocabs id');
            }
            const key = entry.id.slice(vocabsDefinition.id.length);
            acc[entry.id] = this.getBestLabels(entry, key);
            return acc;
        }, {} as VocabsMap);
    }

    private flattenEntries(entries: DefinitionEntry[]): DefinitionEntry[] {
        let additionalEntries: DefinitionEntry[] = [];
        for (const entry of entries) {
            if (entry.narrower) {
                additionalEntries = [...additionalEntries, ...this.flattenEntries(entry.narrower)];
            }
        }
        return [...entries, ...additionalEntries];
    }

    private generateReverseMap(vocabsMap: VocabsMap) {
        return Object.values(Language).reduce((acc, language) => {
            acc[language] = Object.entries(vocabsMap).reduce((innerAcc, [id, mapEntry]) => {
                innerAcc[mapEntry[language]] = id;
                return innerAcc;
            }, {} as { [label: string]: string });
            return acc;
        }, {} as ReverseMap);
    }

    /**
     * Gets the best available labels in all languages.
     */
    private getBestLabels(entry: DefinitionEntry, fallback: string) {
        return Object.values(Language).reduce((acc, language) => {
            acc[language] = this.getBestLabel(entry, language, fallback);
            return acc;
        }, {} as { [language in Language]: string });
    }

    /**
     * Gets the best available label on the entry in the given language.
     *
     * `prefLabel` is not always defined, so also try `altLabel`s and fall back to the key if
     * nothing else is found.
     */
    private getBestLabel(entry: DefinitionEntry, language: Language, fallback: string) {
        return entry.prefLabel[language] || entry.altLabel?.[language]?.[0] || fallback;
    }
}

class Vocabs {
    private vocabsDictionaries: { [scheme in VocabsScheme]: VocabsDictionary };

    constructor() {
        this.vocabsDictionaries = {
            [Facet.discipline]: new VocabsDictionary(discipline),
            [Facet.educationalContext]: new VocabsDictionary(educationalContext),
            [Facet.intendedEndUserRole]: new VocabsDictionary(intendedEndUserRole),
            [Facet.learningResourceType]: new VocabsDictionary(learningResourceType),
            conditionsOfAccess: new VocabsDictionary(conditionsOfAccess),
            price: new VocabsDictionary(price),
            widgets: new VocabsDictionary(widgets),
            containsAdvertisement: new VocabsDictionary(containsAdvertisement),
        };
    }

    /**
     * Gets label for the given entry by id.
     *
     * Falls back to returning the id if the vocabs entry is missing.
     */
    getLabel(vocabsScheme: VocabsScheme, id: string, language: Language) {
        const label = this.vocabsDictionaries[vocabsScheme].vocabsMap[id]?.[language];
        if (label === undefined) {
            warn(`Encountered missing vocabs entry ${id} for vocabs scheme ${vocabsScheme}`);
            return id;
        }
        return label;
    }

    /**
     * Gets the id for the given entry by label.
     *
     * Falls back to returning the label if the vocabs entry is missing. This happens when
     * getLabel() returned the id as label earlier, so in case the reverse lookup fails, the label
     * already is the id.
     */
    getId(vocabsScheme: VocabsScheme, label: string, language: Language) {
        let id = this.vocabsDictionaries[vocabsScheme].reverseMap[language][label];
        if (id === undefined) {
            id = label;
        }
        return id;
    }

    /**
     * Gets the entry id by key.
     */
    keyToId(vocabsScheme: VocabsScheme, key: string) {
        return this.vocabsDictionaries[vocabsScheme].id + key;
    }

    /**
     * Gets the entry key by id.
     *
     * Falls back to returning the id if the scheme id does not match.
     */
    idToKey(vocabsScheme: VocabsScheme, id: string) {
        const schemeId = this.vocabsDictionaries[vocabsScheme].id;
        if (id.startsWith(schemeId)) {
            return id.slice(schemeId.length);
        } else {
            warn(`Encountered invalid id ${id} for vocabs scheme ${vocabsScheme}`);
            return id;
        }
    }
}

export const vocabs = new Vocabs();
