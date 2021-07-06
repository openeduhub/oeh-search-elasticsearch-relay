import axios from 'axios';
import fs from 'fs';
import { promisify } from 'util';
const writeFile = promisify(fs.writeFile);

const vocabsSchemes = [
    'educationalContext',
    'intendedEndUserRole',
    'learningResourceType',
    'discipline',
    'conditionsOfAccess',
    'widgets',
    'price',
    'containsAdvertisement',
];
const targetDir = 'src/assets/vocabs';

function getVocabsUrl(vocabsScheme: string): string {
    return `https://vocabs.openeduhub.de/w3id.org/openeduhub/vocabs/${vocabsScheme}/index.json`;
}

async function updateVocabsEntry(vocabsScheme: string) {
    const res = await axios.get(getVocabsUrl(vocabsScheme));
    printIncompleteVocabs(vocabsScheme, res.data);
    const json = JSON.stringify(res.data, null, 2);
    const filePath = `${targetDir}/${vocabsScheme}.json`;
    await writeFile(filePath, json);
    console.log(`updated ${vocabsScheme}`);
}

function printIncompleteVocabs(vocabsScheme: string, vocabsDefinition: any) {
    const requiredLanguages = ['de', 'en'];
    const vocabs = vocabsDefinition.hasTopConcept;
    const incompleteVocabs: any[] = vocabs.filter(
        (entry: { prefLabel: { [language: string]: string } }) =>
            requiredLanguages.some((language) => !entry.prefLabel[language]),
    );
    if (incompleteVocabs.length > 0) {
        console.warn(`\nMissing labels in ${vocabsScheme}:`);
        for (const entry of incompleteVocabs) {
            console.log(JSON.stringify(entry, null, 2));
        }
    }
}

export async function updateVocabs() {
    return Promise.all(vocabsSchemes.map(updateVocabsEntry));
}

if (require.main === module) {
    updateVocabs().catch((error) => {
        console.error('failed to update vocabs:', error.message);
        process.exit(1);
    });
}
