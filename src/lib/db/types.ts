import type { Row, TableName } from "../types";

/** Equality filter; an array value means "IN (...)". */
export type Filter<T> = { [K in keyof T]?: T[K] | T[K][] };

export interface QueryOptions<T> {
  orderBy?: keyof T & string;
  ascending?: boolean;
  limit?: number;
  /** Inclusive lower / exclusive upper bound on a column (ISO dates compare lexicographically). */
  range?: { column: keyof T & string; gte?: string | number; lt?: string | number };
}

/**
 * Minimal table gateway. Business rules live in `src/lib/services`, which only
 * talk to this interface — so the same services run against the local JSON
 * store (development/demo) and Supabase/PostgreSQL (production).
 */
export interface Db {
  readonly backend: "local" | "supabase";
  list<T extends TableName>(table: T, filter?: Filter<Row<T>>, options?: QueryOptions<Row<T>>): Promise<Row<T>[]>;
  get<T extends TableName>(table: T, id: string): Promise<Row<T> | null>;
  findOne<T extends TableName>(table: T, filter: Filter<Row<T>>): Promise<Row<T> | null>;
  count<T extends TableName>(table: T, filter?: Filter<Row<T>>, options?: Pick<QueryOptions<Row<T>>, "range">): Promise<number>;
  insert<T extends TableName>(table: T, row: Row<T>): Promise<Row<T>>;
  insertMany<T extends TableName>(table: T, rows: Row<T>[]): Promise<Row<T>[]>;
  update<T extends TableName>(table: T, id: string, patch: Partial<Row<T>>): Promise<Row<T>>;
  remove<T extends TableName>(table: T, id: string): Promise<void>;
}
