import { dirname, join, relative } from 'node:path';
import { execSync } from 'node:child_process';
import { Transform } from 'node:stream';
import vfs from 'vinyl-fs';
import type { StreamFile } from 'vinyl';
// @ts-ignore
import { transform as I18nextTransform, type UserConfig } from 'i18next-parser';
import colors from 'colors';

export async function parseTranslations(projectPath: string, config: UserConfig, verbose = false) {
  const cwd = process.cwd();
  const command = `tsc --listFilesOnly --project ${join(projectPath, 'tsconfig.json')}`;

  if (verbose) console.info(colors.cyan(`Running: `) + command);

  const output = execSync(command);
  const sources = output
    .toString('utf-8')
    .split('\n')
    .filter((file) => !file.includes('node_modules') && file !== '' && !file.endsWith('.d.ts'));

  if (verbose) {
    console.info(colors.green(`TypeScript found ${sources.length} source files`));
  }

  // should the cwd be passed via cli args?
  // This is not the process cwd, but used for scanning files with absolute paths outside the actual cwd
  //  option 1: determine the cwd (current)
  //  option 2: add option for cli option `--cwd ../../` (might be confusing)
  //  option 3: run script via `"i18next": "cd ../../ && i18next-workspaces ./packages/project"`
  const sourceCwd = sources.map(dirname).reduce((previousValue, currentValue) => {
    const rel = relative(previousValue, currentValue);
    return rel.startsWith('..') ? join(previousValue, rel.match(/(\.\.\/?)+/)?.[0] || '') : previousValue;
  }, cwd);

  if (relative(cwd, sourceCwd).length > 0) {
    console.info(colors.yellow('IMPORTANT: ') + colors.dim(`Using a different cwd for vinyl-fs: ` + sourceCwd));
  }

  let count = 0;

  if (verbose) console.info(colors.cyan('Parsing source files for translations'));

  return new Promise<void>((resolve, reject) => {
    vfs
      .src(sources, { cwd: sourceCwd })
      .pipe(
        (new I18nextTransform(config) as Transform)
          .on('reading', function (file: StreamFile) {
            count++;
          })
          .on('error', function (message: unknown, region: unknown) {
            if (typeof region === 'string') message += ': ' + region.trim();
            console.info(colors.red('  [error] ') + message);
            reject();
          })
          .on('warning', function (message: string) {
            if (verbose) console.info(colors.blue('  [warning] ') + colors.dim(message));
          })
          .on('finish', function () {
            console.info('');
            console.info(colors.green('Translations parsed from ' + count + ' source files'));
            resolve();
          }),
      )
      .pipe(vfs.dest(process.cwd()));
  });
}
