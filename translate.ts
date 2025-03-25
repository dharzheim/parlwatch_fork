const fs = require('node:fs');

const { Translate } = require('@google-cloud/translate').v2;

const texts = {
  de: require('./src/assets/i18n/de.json'),
  en: require('./src/assets/i18n/en.json'),
  fr: require('./src/assets/i18n/fr.json'),
  it: require('./src/assets/i18n/it.json')
};

const translate = new Translate({
  key: process.env.CLOUD_TRANSLATE_API_KEY
});

const originalLanguage = 'de';
type Language = keyof typeof texts;
const targetLanguages = Object.keys(texts).filter(
  (language) => language !== originalLanguage
);

const replaceAll = process.argv.includes('--replace-all');
const withoutCapitalization = process.argv.includes('--without-capitalization');

/**
 *
 */
async function translateTexts() {
  if (!process.env.CLOUD_TRANSLATE_API_KEY) {
    console.log('No API key defined. Please define CLOUD_TRANSLATE_API_KEY');
  }
  console.log('Translating texts...');
  const originalTexts = texts[originalLanguage];

  for (const key in originalTexts) {
    const text = originalTexts[key];

    const translationsNeeded = replaceAll
      ? targetLanguages
      : targetLanguages.filter(
          (lang) =>
            texts[lang][key] === undefined ||
            texts[lang][key].startsWith('Missing value')
        );
    const translatedTexts = await translateText(text, translationsNeeded);

    console.log(`Translated "${key}"`);
    Object.keys(translatedTexts).forEach((language) => {
      console.log(`"${language}": "${translatedTexts[language]}"`);
      texts[language][key] = withoutCapitalization
        ? translatedTexts[language]
        : translatedTexts[language].charAt(0).toUpperCase() +
          translatedTexts[language].slice(1);
    });
  }

  for (const language of targetLanguages) {
    fs.writeFileSync(
      `./src/assets/i18n/${language}.json`,
      JSON.stringify(texts[language], null, 2)
    );
  }
}

/**
 *
 * @param text Text to translate
 * @param targetLanguages Array of languages to translate the text to
 * @returns Object with requested languages as keys and translated text as values
 */
async function translateText(
  text: string,
  targetLanguages: string[]
): Promise<Partial<{ [key in Language]: string }>> {
  const variables = map_variables(text);
  const textWithReplacedVariables = replace_variables(text, variables);
  const translations = {};
  for (const targetLanguage of targetLanguages) {
    const [translation] = await translate.translate(textWithReplacedVariables, {
      from: originalLanguage,
      to: targetLanguage
    });
    translations[targetLanguage] = reverse_replace_variables(
      translation,
      variables
    );
  }
  return translations;
}

const map_variables = (text: string): { [key: string]: string } => {
  const variables = text.match(/{{\s*[\w.]+\s*}}/g);
  if (!variables) {
    return {};
  }
  return variables.reduce((mappedVariables, variable, index) => {
    return { ...mappedVariables, [variable]: `{{${index}}}` };
  }, {});
};

const replace_variables = (
  text: string,
  mappedVariables: { [key: string]: string }
) => {
  return Object.keys(mappedVariables).reduce((acc, key) => {
    return acc.replaceAll(key, mappedVariables[key]);
  }, text);
};

const reverse_replace_variables = (
  text: string,
  mappedVariables: { [key: string]: string }
) => {
  return Object.keys(mappedVariables).reduce((acc, key) => {
    return acc.replaceAll(mappedVariables[key], key);
  }, text);
};

translateTexts();
