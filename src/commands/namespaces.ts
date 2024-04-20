import { generateNamespaces } from '../parsers/namespaces.js';
import { join } from 'node:path';
import { loadConfig, printCommandInformation, validateProjectPath } from './utils.js';
import colors from 'colors';

type Options = {
  config?: string;
  locale?: string;
  prettier: string;
  verbose?: boolean;
};

export const namespaces = async (projectPath: string, outputPath: string, options: Options) => {
  printCommandInformation('namespaces', { projectPath, ...options });
  validateProjectPath(projectPath);

  try {
    const config = await loadConfig(projectPath, options.config, options.verbose);

    await generateNamespaces(join(projectPath, outputPath), config, join(projectPath, options.prettier), options.locale, options.verbose);
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.info(colors.red('Program error: ') + error.message);
    }
  }
};
