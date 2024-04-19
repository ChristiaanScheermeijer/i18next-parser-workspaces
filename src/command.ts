import { pathToFileURL } from 'node:url';
import { join } from 'node:path';
import { existsSync } from 'node:fs';
import colors from 'colors';
import { parseTranslations } from './parser.js';
import { generateNamespaces } from './resources.js';

async function esConfigLoader(filepath: string) {
  return (await import(pathToFileURL(filepath).toString())).default;
}

async function loadConfig(projectPath: string, configFile?: string, verbose = false) {
  const supportedExtensions = ['js', 'mjs'];

  if (configFile) {
    const relativeConfigFile = join(process.cwd(), projectPath, configFile);
    if (verbose) console.info(colors.cyan(`Loading config at: `) + relativeConfigFile);

    if (existsSync(relativeConfigFile)) {
      return esConfigLoader(relativeConfigFile);
    }

    throw new Error(`The i18next parser config was not found at ${relativeConfigFile}`);
  }

  for (const extension of supportedExtensions) {
    const configPath = join(process.cwd(), projectPath, `i18next-parser.config.${extension}`);
    if (verbose) console.info(colors.cyan(`Looking for: ${configPath}`));

    if (existsSync(configPath)) {
      if (verbose) console.info(colors.green(`i18next parser config found!`));
      return esConfigLoader(configPath);
    }
  }

  throw new Error(`The i18next parser config was not found in the project folder ${projectPath}`);
}

type ProgramArgs = {
  projectPath: string;
  configPath: string;
  prettierConfig: string;
  resourcesPath?: string;
  verbose?: boolean;
  locale?: string;
};

export async function run({ projectPath, configPath, prettierConfig, resourcesPath, locale, verbose = false }: ProgramArgs) {
  if (!existsSync(projectPath)) {
    console.info(colors.red(`Project path doesn't exist: `) + projectPath);
    process.exit(1);
  }

  if (verbose) {
    console.info(colors.cyan('Parsed arguments'));
    console.info(colors.dim(JSON.stringify({ projectPath, configPath, prettierConfig, resourcesPath, locale, verbose }, null, 2)));
    console.info(' ');
  }

  try {
    const config = await loadConfig(projectPath, configPath, verbose);

    if (verbose) console.info(' ');

    await parseTranslations(projectPath, config, verbose);

    if (verbose) console.info(' ');

    if (resourcesPath) await generateNamespaces(join(projectPath, resourcesPath), config, join(projectPath, prettierConfig), locale, verbose);
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.info(colors.red('Program error: ') + error.message);
    }
  }
}
