import type { StandardSchemaV1 } from '@/lib/standard-schema';
import { useCallback, useEffect, useRef, useState } from 'react';
import { readStored, writeStored } from '@/lib/storage';

interface Options<T> {
  /** Checks the saved value (zod, valibot… any Standard Schema); a value that fails falls back to `init`. */
  schema?: StandardSchemaV1<unknown, T>;
  /** Wins for this page and is not saved (e.g. a link parameter); changing the value ends it. */
  override?: T;
}

/**
 * A setting kept in localStorage under `<APP_NAME>:<key>` (JSON). Returns the value, a setter, and whether the
 * override is still in force.
 *
 *   const [grid, setGrid] = useStored('grid', true, { schema: z.boolean() });
 */
export function useStored<T>(
  key: string,
  init: T,
  { schema, override }: Options<T> = {},
): [T, (v: T | ((p: T) => T)) => void, boolean] {
  const [value, setValue] = useState<T>(() => override ?? readStored(key, schema) ?? init);
  const [overridden, setOverridden] = useState(override !== undefined);
  const dirty = useRef(false);

  useEffect(() => {
    if (dirty.current) writeStored(key, value);
  }, [key, value]);

  const set = useCallback((next: T | ((p: T) => T)) => {
    dirty.current = true;
    setOverridden(false);
    setValue(next);
  }, []);

  return [value, set, overridden];
}
