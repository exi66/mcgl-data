import 'i18next';
import type ru from '@/messages/ru.json';

// Typed keys: t('...') is checked against ru.json (the source language).
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation';
    resources: { translation: typeof ru };
  }
}
