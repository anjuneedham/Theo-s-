import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Db, Filter, QueryOptions } from "./types";
import { config } from "../config";

/**
 * Supabase/PostgreSQL implementation of the table gateway.
 *
 * Runs on the server only with the service-role key (never shipped to the
 * browser). Authorization is enforced in the service layer before any call
 * reaches this adapter; Row Level Security policies in
 * `supabase/migrations` additionally protect every table from direct access
 * with the public anon key.
 */
let admin: SupabaseClient | null = null;

export function getServiceClient(): SupabaseClient {
  if (!admin) {
    admin = createClient(config.supabase.url, config.supabase.serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return admin;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyFilter(query: any, filter?: Filter<any>, options?: QueryOptions<any>) {
  let q = query;
  if (filter) {
    for (const [key, value] of Object.entries(filter)) {
      if (value === undefined) continue;
      if (value === null) q = q.is(key, null);
      else if (Array.isArray(value)) q = q.in(key, value);
      else q = q.eq(key, value);
    }
  }
  if (options?.range) {
    const { column, gte, lt } = options.range;
    if (gte !== undefined) q = q.gte(column, gte);
    if (lt !== undefined) q = q.lt(column, lt);
  }
  return q;
}

function fail(table: string, error: { message: string } | null): never {
  throw new Error(`[supabase:${table}] ${error?.message ?? "unknown error"}`);
}

export function createSupabaseDb(): Db {
  const client = () => getServiceClient();
  return {
    backend: "supabase",
    async list(table, filter, options) {
      let q = applyFilter(client().from(table).select("*"), filter, options);
      if (options?.orderBy) q = q.order(options.orderBy, { ascending: options.ascending !== false });
      if (options?.limit !== undefined) q = q.limit(options.limit);
      const { data, error } = await q;
      if (error) fail(table, error);
      return data ?? [];
    },
    async get(table, id) {
      const { data, error } = await client().from(table).select("*").eq("id", id).maybeSingle();
      if (error) fail(table, error);
      return data ?? null;
    },
    async findOne(table, filter) {
      const { data, error } = await applyFilter(client().from(table).select("*"), filter).limit(1).maybeSingle();
      if (error) fail(table, error);
      return data ?? null;
    },
    async count(table, filter, options) {
      const { count, error } = await applyFilter(
        client().from(table).select("id", { count: "exact", head: true }),
        filter,
        options,
      );
      if (error) fail(table, error);
      return count ?? 0;
    },
    async insert(table, row) {
      const { data, error } = await client().from(table).insert(row as never).select("*").single();
      if (error) fail(table, error);
      return data;
    },
    async insertMany(table, rows) {
      if (rows.length === 0) return [];
      const { data, error } = await client().from(table).insert(rows as never).select("*");
      if (error) fail(table, error);
      return data ?? [];
    },
    async update(table, id, patch) {
      const { data, error } = await client().from(table).update(patch as never).eq("id", id).select("*").single();
      if (error) fail(table, error);
      return data;
    },
    async updateIf(table, id, where, patch) {
      const { data, error } = await applyFilter(client().from(table).update(patch as never).eq("id", id), where)
        .select("*")
        .maybeSingle();
      if (error) fail(table, error);
      return data ?? null;
    },
    async remove(table, id) {
      const { error } = await client().from(table).delete().eq("id", id);
      if (error) fail(table, error);
    },
  };
}
