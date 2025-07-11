import en from '../dictionaries/en.json';
import ar from '../dictionaries/ar.json';
import es from '../dictionaries/es.json';

const dictionaries = {
    en,
    ar,
    es,
};
/*
export const getDictionary = async (lang) => {
    if (!dictionaries[lang] || dictionaries[lang] === undefined) {
        return await dictionaries["en"]();
    } else {
        return await dictionaries[lang]();
    }


}

*/

export const getDictionary = (lang) => {
    return dictionaries[lang] || dictionaries['en'];
};
