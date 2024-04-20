import colors from 'colors';
import { loadConfig, printCommandInformation, validateProjectPath } from './utils.js';
import { parseTranslations } from '../parsers/translations.js';

type Options = {
  config?: string;
  verbose?: boolean;
};

export const parse = async (projectPath: string, options: Options) => {
  printCommandInformation('parse', { projectPath, ...options });
  validateProjectPath(projectPath);

  try {
    const config = await loadConfig(projectPath, options.config, options.verbose);
    await parseTranslations(projectPath, config, options.verbose);
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.info(colors.red('Program error: ') + error.message);
    }
  }
};
