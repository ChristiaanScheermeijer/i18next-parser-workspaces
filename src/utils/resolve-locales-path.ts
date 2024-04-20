import { UserConfig } from 'i18next-parser';

export function resolveLocalesPath(config: UserConfig) {
  return config.output?.replace('/$LOCALE', '').replace('/$NAMESPACE.json', '') || 'locales';
}
