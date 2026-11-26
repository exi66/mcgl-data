import type { StandardSchemaV1 } from '@/lib/standard-schema';
import { APP_NAME } from '@/lib/app';

/** Keys shared by every project on the domain on purpose; all other keys get the `<APP_NAME>:` prefix. */
const SHARED_KEYS = new Set(['theme', 'i18nextLng']);

export const storageKey = (key: string, app = APP_NAME) => (SHARED_KEYS.has(key) ? key : `${app}:${key}`);

/**
 * Validates synchronously with any Standard Schema validator (zod, valibot…); `undefined` when the value does not
 * match. Async schemas are treated as a mismatch.
 */
export function validate<T>(schema: StandardSchemaV1<unknown, T>, value: unknown): T | undefined {
  const result = schema['~standard'].validate(value);
  if (result instanceof Promise || result.issues) return undefined;
  return result.value;
}

/**
 * Reads a JSON value; `undefined` when missing, unparsable, rejected by `schema`, or storage is unavailable.
 */
export function readStored<T>(
  key: string,
  schema?: StandardSchemaV1<unknown, T>,
  storage: Pick<Storage, 'getItem'> | undefined = globalThis.localStorage,
): T | undefined {
  try {
    const s = storage?.getItem(storageKey(key));
    if (s == null) return undefined;
    const value: unknown = JSON.parse(s);
    return schema ? validate(schema, value) : (value as T);
  } catch {
    return undefined;
  }
}

/** Writes a JSON value; ignores unavailable storage (private mode, quota). */
export function writeStored<T>(
  key: string,
  value: T,
  storage: Pick<Storage, 'setItem'> | undefined = globalThis.localStorage,
) {
  try {
    storage?.setItem(storageKey(key), JSON.stringify(value));
  } catch {
    /* ignore */
  }
}
