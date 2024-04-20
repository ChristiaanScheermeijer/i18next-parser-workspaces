import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadConfig } from '../commands/utils.js';
import { resolveLocalesPath } from '../utils/resolve-locales-path.js';
import colors from 'colors';

type Trans = {
  [key: string]: Trans | string;
};

function flattenObject(obj: Trans, parentKey: string = ''): Record<string, string> {
  let result: Record<string, string> = {};

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const newKey = parentKey ? `${parentKey}.${key}` : key;
      const value = obj[key];

      if (typeof value === 'object' && value !== null) {
        // Recursively flatten nested objects
        const nestedFlattened = flattenObject(value, newKey);
        result = { ...result, ...nestedFlattened };
      } else if (typeof value === 'string') {
        // Assign the value to the flattened key
        result[newKey] = value;
      }
    }
  }

  return result;
}

function iterateTranslations(localesPath: string, callback: (language: string, namespace: string) => void) {
  const languages = readdirSync(localesPath, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name);

  for (const languageIndex in languages) {
    const languagePath = join(localesPath, languages[languageIndex]);
    const files = readdirSync(languagePath, { withFileTypes: true })
      .filter((dirent) => dirent.isFile() && !/_old\.json/.test(dirent.name))
      .map((dirent) => dirent.name.replace('.json', ''));

    for (const fileIndex in files) {
      callback(languages[languageIndex], files[fileIndex]);
    }
  }
}

function applyMissingTranslations(key: string, translations: Trans, sourceTranslations: Record<string, string>, parentKey = '') {
  for (const key in translations) {
    if (Object.prototype.hasOwnProperty.call(translations, key)) {
      const flatKey = parentKey ? `${parentKey}.${key}` : key;
      const value = translations[key];

      if (typeof value === 'object' && value !== null) {
        translations[key] = applyMissingTranslations(key, value, sourceTranslations, flatKey);
      } else {
        if (translations[key] === '' && sourceTranslations[flatKey]) {
          console.info(colors.cyan(` [fill]: `) + colors.dim(key) + ':' + flatKey);
          translations[key] = sourceTranslations[flatKey];
        }
      }
    }
  }

  return translations;
}

export async function fillMissingTranslations(sourceProject: string, targetProject: string, configA?: string, configB?: string, verbose = false) {
  const translations: Record<string, Record<string, string>> = {};

  const sourceConfig = await loadConfig(sourceProject, configA, verbose);
  const targetConfig = await loadConfig(targetProject, configB, verbose);

  const sourceLocalesPath = resolveLocalesPath(sourceConfig);
  const targetLocalesPath = resolveLocalesPath(targetConfig);

  // in the first pass, we build a translation dictionary using flattened keys
  // the key is the language + '_' + namespace
  // when a translation is missing or empty it's used from a different platform
  iterateTranslations(sourceLocalesPath, (language, namespace) => {
    const languagePath = join(sourceLocalesPath, language);
    const parsed = JSON.parse(readFileSync(join(languagePath, `${namespace}.json`), 'utf-8'));
    const key = `${language}_${namespace}`;
    const flattened = flattenObject(parsed);

    if (!translations[key]) {
      translations[key] = flattened;
      return;
    }

    for (const translationKey in flattened) {
      if (!(translationKey in translations[key]) || translations[key][translationKey] === '') {
        translations[key][translationKey] = flattened[translationKey];
      }
    }
  });

  iterateTranslations(targetLocalesPath, (language, namespace) => {
    const languagePath = join(targetLocalesPath, language);
    const parsed = JSON.parse(readFileSync(join(languagePath, `${namespace}.json`), 'utf-8'));
    const key = `${language}_${namespace}`;

    if (translations[key]) {
      const fixedTranslations = applyMissingTranslations(key, parsed, translations[key]);
      writeFileSync(join(languagePath, `${namespace}.json`), JSON.stringify(fixedTranslations, null, 2) + '\n');
      console.info(colors.green(' [write]: ') + colors.dim(join(languagePath, `${namespace}.json`)));
    } else {
      console.info(colors.blue(` [warning]: `) + `Missing source translations for ${namespace} in language ${language}`);
    }
  });

  console.info(colors.green(`Ready filling missing translations for: `) + colors.dim(targetLocalesPath));
}
