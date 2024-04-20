import colors from 'colors';
import { loadConfig, printCommandInformation, validateProjectPath } from './utils.js';
import { parseTranslations } from '../parsers/translations.js';
import { fillMissingTranslations } from '../parsers/sync.js';

type Options = {
  configA?: string;
  configB?: string;
  verbose?: boolean;
};

export const fillMissing = async (projectA: string, projectB: string, options: Options) => {
  printCommandInformation('sync', { projectA, projectB, ...options });
  validateProjectPath(projectA);
  validateProjectPath(projectB);

  try {
    await fillMissingTranslations(projectA, projectB, options.configA, options.configB, options.verbose);
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.info(colors.red('Program error: ') + error.message);
    }
  }
};
