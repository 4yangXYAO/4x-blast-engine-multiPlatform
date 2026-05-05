declare module 'better-sqlite3' {
  interface Database {
    exec(sql: string): void
    prepare(sql: string): Statement
    pragma(pragma: string, mode?: 'strict' | 'trace'): unknown
    transaction<T>(fn: (...args: unknown[]) => T): (...args: unknown[]) => T
    close(): void
    export(): Buffer
  }

  interface Statement {
    run(...params: unknown[]): { changes: number; lastInsertRowid: number }
    get(...params: unknown[]): Record<string, unknown>
    all(...params: unknown[]): Record<string, unknown>[]
    bind(...params: unknown[]): boolean
    step(): boolean
    getAsObject(): Record<string, unknown>
    free(): void
    reset(): void
  }

  const Database: new (path: string, options?: { readonly?: boolean }) => Database
  export { Database, Statement }
  export default Database
}