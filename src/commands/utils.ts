import { pathToFileURL } from 'node:url';
import { join } from 'node:path';
import { existsSync } from 'node:fs';
import colors from 'colors';
import { UserConfig } from 'i18next-parser';

async function esConfigLoader(filepath: string): Promise<UserConfig> {
  return (await import(pathToFileURL(filepath).toString())).default;
}

export async function loadConfig(projectPath: string, configFile?: string, verbose = false) {
  const supportedExtensions = ['js', 'mjs', 'cjs'];

  if (configFile) {
    const relativeConfigFile = join(process.cwd(), projectPath, configFile);
    if (verbose) console.info(colors.cyan(`Loading config at: `) + colors.dim(relativeConfigFile));

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

export function validateProjectPath(projectPath: string) {
  if (!existsSync(projectPath)) {
    console.info(colors.red(`Project path doesn't exist: `) + projectPath);
    process.exit(1);
  }
}

export function printCommandInformation(command: string, options: Record<string, unknown>) {
  if (options.verbose) {
    console.info(colors.cyan(`Running command: `) + command);
    console.info(colors.dim(JSON.stringify(options, null, 2)));
    console.info(' ');
  }
}
