import { join } from 'node:path';
import { execSync } from 'node:child_process';
import { Transform } from 'node:stream';
import vfs from 'vinyl-fs';
import type { StreamFile } from 'vinyl';
// @ts-ignore
import { transform as I18nextTransform, type UserConfig } from 'i18next-parser';
import colors from 'colors';

export async function parseTranslations(projectPath: string, config: UserConfig, verbose = false) {
  const cwd = process.cwd();
  const output = execSync(`tsc --listFilesOnly --project ${join(projectPath, 'tsconfig.json')}`);
  const sources = output
    .toString('utf-8')
    .split('\n')
    .filter((file) => !file.includes('node_modules') && file !== '' && !file.endsWith('.d.ts'));

  if (verbose) console.info(colors.cyan(`  [tsc] found ${sources.length} source files`));

  let count = 0;

  return new Promise<void>((resolve, reject) => {
    vfs
      .src(sources)
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
          .on('warning', function (message: unknown) {
            if (verbose) console.info(colors.blue('  [warning] ') + message);
          })
          .on('finish', function () {
            console.info(colors.green('Translations parsed from ' + count + ' source files'));
            resolve();
          }),
      )
      .pipe(vfs.dest(cwd));
  });
}
