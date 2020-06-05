import axios from 'axios';
import { config } from '../config';

export enum Vocab {
    discipline,
    educationalContext,
}

interface VocabDefinition {
    id: string;
    type: string;
    hasTopConcept: Array<{
        id: string;
        prefLabel: {
            de: string;
            en: string;
        };
        altLabel?: {
            de?: string[];
            en?: string[];
        };
    }>;
}

type VocabMap = { [key: string]: { de: string; en: string } };

class VocabDictionary {
    private vocabMaps?: { [vocab in Vocab]: VocabMap };

    constructor() {
        if (config.production) {
            this.init();
        }
    }

    isInitialized() {
        return !!this.vocabMaps;
    }

    get(vocab: Vocab, id: string) {
        if (!this.vocabMaps) {
            throw new Error('Vocab not initialized');
        }
        return this.vocabMaps[vocab][id];
    }

    async init() {
        const vocabDefinitions = await this.fetchVocabDefinitions();
        this.vocabMaps = Object.entries(vocabDefinitions).reduce((acc, [key, vocabDefinition]) => {
            acc[Number(key) as Vocab] = this.mapVocab(vocabDefinition);
            return acc;
        }, {} as { [vocab in Vocab]: VocabMap });
    }

    private async fetchVocabDefinitions(): Promise<{ [vocab in Vocab]: VocabDefinition }> {
        const keys: Vocab[] = Object.keys(Vocab)
            .map(Number)
            .filter((key) => !isNaN(key));
        try {
            const response = await axios.all(
                keys.map((key) =>
                    axios.get(
                        `https://vocabs.openeduhub.de/w3id.org/openeduhub/vocabs/${
                            Vocab[Number(key)]
                        }/index.json`,
                    ),
                ),
            );
            console.log('Fetching vocab done.');
            return keys.reduce((acc, key, index) => {
                acc[key] = response[index].data;
                return acc;
            }, {} as { [vocab in Vocab]: VocabDefinition });
        } catch (error) {
            throw new Error('Error fetching vocab: ' + error.message);
        }
    }

    private mapVocab(vocab: VocabDefinition): VocabMap {
        return vocab.hasTopConcept.reduce((acc, entry) => {
            if (!entry.id.startsWith(vocab.id)) {
                throw new Error('Unexpected vocab id');
            }
            const key = entry.id.slice(vocab.id.length);
            acc[key] = entry.prefLabel;
            return acc;
        }, {} as VocabMap);
    }
}

export const vocab = new VocabDictionary();
