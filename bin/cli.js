#!/usr/bin/env node
import { program } from 'commander';
import { parse } from '../lib/commands/parse.js';
import { namespaces } from '../lib/commands/namespaces.js';
import { fillMissing } from '../lib/commands/fill-missing.js';

program.name('i18next-workspaces').description('i18next utilities for workspaces');

program
  .command('parse')
  .description('parse translations from all source files in your TypeScript project')
  .argument('<projectPath>', 'the project directory that contains a tsconfig.json')
  .option('--config <file>', 'path to your i18next-parser config (default: i18next-parser.config.[js,mjs])')
  .option('--verbose', 'enable additional logging', false)
  .action((projectPath, options) => parse(projectPath, options));

program
  .command('namespaces')
  .description('generate a namespaces file that exports all namespaces as string')
  .argument('<projectPath>', 'the project directory')
  .argument('[outputFile]', 'the output path to the generated file', 'src/i18n/resources.ts')
  .option('--config <file>', 'path to your i18next-parser config (default: i18next-parser.config.[js,mjs])')
  .option('--locale <locale>', 'the locale to look for namespaces (default: first locale in i18next parser config)')
  .option('--prettier <config>', 'the path to the prettier config', '.prettierrc')
  .option('--verbose', 'enable additional logging', false)
  .action((projectPath, outputFile, options) => namespaces(projectPath, outputFile, options));

program
  .command('fill-missing')
  .description('fill missing translations in projectB using projectA as the source')
  .argument('<projectA>', 'the source project directory')
  .argument('<projectB>', 'the target project directory')
  .option('--configA <file>', 'path to your i18next-parser config for projectA (default: i18next-parser.config.[js,mjs])')
  .option('--configB <file>', 'path to your i18next-parser config for projectB (default: i18next-parser.config.[js,mjs])')
  .option('--verbose', 'enable additional logging', false)
  .action((projectA, projectB, options) => fillMissing(projectA, projectB, options));

program.parse();
