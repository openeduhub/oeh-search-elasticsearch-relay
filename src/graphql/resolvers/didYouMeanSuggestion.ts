import { QueryResolvers, DidYouMeanSuggestion } from '../../generated/graphql';
import { generateSearchQuery } from './search';
import { client } from '../../common/elasticSearchClient';
import { mapping } from '../../mapping';

interface Suggest {
    text: string;
    offset: number;
    length: number;
    options: SuggestOption[];
}

interface SuggestOption {
    text: string;
    score: number;
    freq: number;
}

const didYouMeanSuggestionResolver: QueryResolvers['didYouMeanSuggestion'] = async (
    root,
    args,
    context,
    info,
): Promise<DidYouMeanSuggestion | null> => {
    const { body } = await client.search({
        body: {
            size: 0,
            query: generateSearchQuery(
                args.searchString,
                args.filters ?? null,
                args.language ?? null,
            ),
            suggest: generateSuggest(args.searchString),
        },
    });
    return getDidYouMeanSuggestion(body.suggest);
};

function generateSuggest(searchString?: string) {
    if (searchString) {
        return {
            text: searchString,
            title: {
                term: {
                    field: mapping.getDidYouMeanSuggestionField(),
                },
            },
        };
    } else {
        return undefined;
    }
}

function getDidYouMeanSuggestion(suggest?: { [label: string]: any }) {
    // TODO: consider suggestions for multiple fields
    if (suggest) {
        const didYouMeanSuggestion = processDidYouMeanSuggestion(suggest.title);
        return didYouMeanSuggestion;
    } else {
        return null;
    }
}

function processDidYouMeanSuggestion(suggests: Suggest[]) {
    const words = suggests.map((suggest) => {
        if (suggest.options.length > 0) {
            return { text: suggest.options[0].text, changed: true };
        } else {
            return { text: suggest.text, changed: false };
        }
    });
    if (words.some((word) => word.changed)) {
        return {
            plain: words.map((word) => word.text).join(' '),
            html: words
                .map((word) => (word.changed ? `<em>${word.text}</em>` : word.text))
                .join(' '),
        };
    } else {
        return null;
    }
}

export default didYouMeanSuggestionResolver;
