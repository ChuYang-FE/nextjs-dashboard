/**
 * Ambient fallback for `postgres` when the language service does not resolve
 * the package `exports` map the same way as `tsc` (TS2307).
 * Kept permissive so it matches real usage across the app.
 */
declare module "postgres" {
  type Sql = <T extends readonly any[] = readonly any[]>(
    strings: TemplateStringsArray,
    ...values: any[]
  ) => Promise<T>;

  function postgres(connection: string, options?: Record<string, unknown>): Sql;

  export = postgres;
}
