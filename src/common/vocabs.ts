import discipline from '../assets/vocabs/discipline.json';
import educationalContext from '../assets/vocabs/educationalContext.json';
import intendedEndUserRole from '../assets/vocabs/intendedEndUserRole.json';
import learningResourceType from '../assets/vocabs/learningResourceType.json';
import { Facet, Language } from '../generated/graphql';
import { warn } from './utils';

export const vocabsSchemes = {
    [Facet.Discipline]: {},
    [Facet.EducationalContext]: {},
    [Facet.IntendedEndUserRole]: {},
    [Facet.LearningResourceType]: {},
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
    /** Maps value keys to labels in all languages. */
    readonly vocabsMap: VocabsMap;
    /** Maps labels to value keys in all languages. */
    readonly reverseMap: ReverseMap;

    constructor(vocabsDefinition: VocabsDefinition) {
        this.id = vocabsDefinition.id;
        this.vocabsMap = this.generateVocabsMap(vocabsDefinition);
        this.reverseMap = this.generateReverseMap(this.vocabsMap);
    }

    private generateVocabsMap(vocabsDefinition: VocabsDefinition): VocabsMap {
        return vocabsDefinition.hasTopConcept.reduce((acc, entry) => {
            if (!entry.id.startsWith(vocabsDefinition.id)) {
                throw new Error('Unexpected vocabs id');
            }
            const key = entry.id.slice(vocabsDefinition.id.length);
            acc[key] = this.getBestLabels(entry, key);
            return acc;
        }, {} as VocabsMap);
    }

    private generateReverseMap(vocabsMap: VocabsMap) {
        return Object.values(Language).reduce((acc, language) => {
            acc[language] = Object.entries(vocabsMap).reduce((innerAcc, [key, mapEntry]) => {
                innerAcc[mapEntry[language]] = key;
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
            [Facet.Discipline]: new VocabsDictionary(discipline),
            [Facet.EducationalContext]: new VocabsDictionary(educationalContext),
            [Facet.IntendedEndUserRole]: new VocabsDictionary(intendedEndUserRole),
            [Facet.LearningResourceType]: new VocabsDictionary(learningResourceType),
        };
    }

    /**
     * Gets label for the given entry by key.
     *
     * Falls back to returning the key if the vocabs entry is missing.
     */
    getLabel(vocabsScheme: VocabsScheme, key: string, language: Language) {
        const label = this.vocabsDictionaries[vocabsScheme].vocabsMap[key]?.[language];
        if (label === undefined) {
            warn(`Encountered missing vocabs entry ${key} for vocabs scheme ${vocabsScheme}`);
            return key;
        }
        return label;
    }

    /**
     * Gets the key for the given entry by label.
     *
     * Falls back to returning the label if the vocabs entry is missing. This happens when
     * getLabel() returned the key as label earlier, so in case the reverse lookup fails, the label
     * already is the key.
     */
    getId(vocabsScheme: VocabsScheme, label: string, language: Language) {
        let key = this.vocabsDictionaries[vocabsScheme].reverseMap[language][label];
        if (key === undefined) {
            key = label;
        }
        return this.keyToId(vocabsScheme, key);
    }

    /**
     * Gets the entry id by key.
     *
     * Falls back to returning the key if the vocabs entry is missing. This happens when `idToKey()`
     * returned the id as key earlier, so in case the lookup fails, the key already is the id.
     */
    keyToId(vocabsScheme: VocabsScheme, key: string) {
        if (key in this.vocabsDictionaries[vocabsScheme].vocabsMap) {
            return this.vocabsDictionaries[vocabsScheme].id + key;
        } else {
            return key;
        }
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
