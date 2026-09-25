import "server-only";
import { config, assertProductionSafety } from "../config";
import type { Db } from "./types";
import { createLocalDb } from "./local";
import { createSupabaseDb } from "./supabase";

let db: Db | null = null;

export function getDb(): Db {
  if (!db) {
    assertProductionSafety();
    db = config.dataBackend === "supabase" ? createSupabaseDb() : createLocalDb();
  }
  return db;
}

export type { Db } from "./types";
