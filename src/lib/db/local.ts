import fs from "node:fs";
import path from "node:path";
import type { Row, TableMap, TableName } from "../types";
import type { Db, Filter, QueryOptions } from "./types";
import { buildSeed } from "./seed";
import { config } from "../config";

type Store = { [K in TableName]: TableMap[K][] };

interface LocalState {
  data: Store;
  loadedAt: number;
  file: string;
  writable: boolean;
}

const globalForStore = globalThis as unknown as { __theosLocalStore?: LocalState };

function emptyStore(): Store {
  return {} as Store;
}

function load(): LocalState {
  const file = path.resolve(process.cwd(), config.localDataDir, "db.json");
  const existing = globalForStore.__theosLocalStore;
  if (existing) {
    // Reload if another process (e.g. a build worker) changed the file.
    try {
      const mtime = fs.statSync(file).mtimeMs;
      if (mtime <= existing.loadedAt) return existing;
    } catch {
      return existing;
    }
  }

  let data: Store | null = null;
  try {
    data = JSON.parse(fs.readFileSync(file, "utf8")) as Store;
  } catch {
    data = null;
  }
  let writable = true;
  if (!data) {
    data = buildSeed({ sampleOrders: config.seedSampleOrders }) as Store;
    try {
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, JSON.stringify(data));
    } catch {
      writable = false;
      console.warn("[theos] Local data directory is not writable; using in-memory data only.");
    }
  }
  const state: LocalState = { data: data ?? emptyStore(), loadedAt: Date.now(), file, writable };
  globalForStore.__theosLocalStore = state;
  return state;
}

function persist(state: LocalState) {
  if (!state.writable) return;
  try {
    fs.mkdirSync(path.dirname(state.file), { recursive: true });
    const tmp = `${state.file}.${process.pid}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(state.data));
    fs.renameSync(tmp, state.file);
    state.loadedAt = Date.now();
  } catch (err) {
    state.writable = false;
    console.warn("[theos] Could not persist local data:", (err as Error).message);
  }
}

function table<T extends TableName>(state: LocalState, name: T): Row<T>[] {
  if (!state.data[name]) (state.data as Record<string, unknown[]>)[name] = [];
  return state.data[name] as Row<T>[];
}

function matches<T>(row: T, filter?: Filter<T>): boolean {
  if (!filter) return true;
  for (const [key, expected] of Object.entries(filter)) {
    if (expected === undefined) continue;
    const actual = (row as Record<string, unknown>)[key];
    if (Array.isArray(expected)) {
      if (!expected.includes(actual as never)) return false;
    } else if (actual !== expected) {
      return false;
    }
  }
  return true;
}

function inRange<T>(row: T, range?: QueryOptions<T>["range"]): boolean {
  if (!range) return true;
  const value = (row as Record<string, unknown>)[range.column] as string | number | null;
  if (value === null || value === undefined) return false;
  if (range.gte !== undefined && value < range.gte) return false;
  if (range.lt !== undefined && value >= range.lt) return false;
  return true;
}

const clone = <T>(v: T): T => structuredClone(v);

export function createLocalDb(): Db {
  return {
    backend: "local",
    async list(name, filter, options) {
      const state = load();
      let rows = table(state, name).filter((r) => matches(r, filter) && inRange(r, options?.range));
      if (options?.orderBy) {
        const key = options.orderBy;
        const dir = options.ascending === false ? -1 : 1;
        rows = [...rows].sort((a, b) => {
          const av = (a as unknown as Record<string, unknown>)[key] as string | number;
          const bv = (b as unknown as Record<string, unknown>)[key] as string | number;
          return av < bv ? -dir : av > bv ? dir : 0;
        });
      }
      if (options?.limit !== undefined) rows = rows.slice(0, options.limit);
      return clone(rows);
    },
    async get(name, id) {
      const row = table(load(), name).find((r) => (r as { id: string }).id === id);
      return row ? clone(row) : null;
    },
    async findOne(name, filter) {
      const row = table(load(), name).find((r) => matches(r, filter));
      return row ? clone(row) : null;
    },
    async count(name, filter, options) {
      return table(load(), name).filter((r) => matches(r, filter) && inRange(r, options?.range)).length;
    },
    async insert(name, row) {
      const state = load();
      const rows = table(state, name);
      if (rows.some((r) => (r as { id: string }).id === (row as { id: string }).id)) {
        throw new Error(`Duplicate id in ${name}`);
      }
      rows.push(clone(row));
      persist(state);
      return clone(row);
    },
    async insertMany(name, newRows) {
      const state = load();
      table(state, name).push(...clone(newRows));
      persist(state);
      return clone(newRows);
    },
    async update(name, id, patch) {
      const state = load();
      const rows = table(state, name);
      const index = rows.findIndex((r) => (r as { id: string }).id === id);
      if (index === -1) throw new Error(`${name} ${id} not found`);
      rows[index] = { ...rows[index], ...clone(patch), id } as Row<typeof name>;
      persist(state);
      return clone(rows[index]);
    },
    async updateIf(name, id, where, patch) {
      const state = load();
      const rows = table(state, name);
      const index = rows.findIndex((r) => (r as { id: string }).id === id);
      if (index === -1 || !matches(rows[index], where)) return null;
      rows[index] = { ...rows[index], ...clone(patch), id } as Row<typeof name>;
      persist(state);
      return clone(rows[index]);
    },
    async remove(name, id) {
      const state = load();
      const rows = table(state, name);
      const index = rows.findIndex((r) => (r as { id: string }).id === id);
      if (index !== -1) rows.splice(index, 1);
      persist(state);
    },
  };
}

/** Test helper: reset the in-memory store to a fresh seed without touching disk. */
export function resetLocalStoreForTests(options: { sampleOrders?: boolean } = {}) {
  globalForStore.__theosLocalStore = {
    data: buildSeed({ sampleOrders: options.sampleOrders ?? false }) as Store,
    loadedAt: Number.MAX_SAFE_INTEGER,
    file: "/dev/null",
    writable: false,
  };
}
