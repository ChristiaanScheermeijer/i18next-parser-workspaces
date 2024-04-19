#!/usr/bin/env node
import { program } from 'commander';
import { run } from '../lib/command.js';

program
  .name('i18next-workspaces')
  .description('Run i18next-parser over all source files in your TypeScript project')
  .argument('<projectPath>', 'the project directory that contains a tsconfig.json')
  .option('--config <file>', 'path to your i18next-parser config', 'i18next-parser.config.js')
  .option('--resources <file>', 'generate a resources file that exports all namespaces')
  .option('--locale <locale>', 'the locale to look for namespaces (default: first locale in i18next parser config)')
  .option('--prettier <config>', 'the path to the prettier config', '.prettierrc')
  .option('--verbose', 'enable additional logging')
  .parse();

const options = program.opts();
const [projectPath] = program.args;

run({
  projectPath,
  configPath: options.config,
  resourcesPath: options.resources,
  locale: options.locale,
  prettierConfig: options.prettier,
  verbose: options.verbose,
});
