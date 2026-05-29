import { createClient, SupabaseClient } from "@supabase/supabase-js";

import type { CompanySignal, RawStatement } from "@/lib/types";

function getSupabaseUrl(): string {
  const url = process.env.SUPABASE_URL?.trim();
  if (!url) {
    throw new Error("SUPABASE_URL is not configured");
  }
  return url;
}

function getSupabaseAnonKey(): string {
  const key = process.env.SUPABASE_ANON_KEY?.trim();
  if (!key) {
    throw new Error("SUPABASE_ANON_KEY is not configured");
  }
  return key;
}

function getSupabaseServiceRoleKey(): string {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!key) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured");
  }
  return key;
}

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.SUPABASE_URL?.trim() && process.env.SUPABASE_ANON_KEY?.trim()
  );
}

export function createSupabaseBrowserClient(): SupabaseClient {
  return createClient(getSupabaseUrl(), getSupabaseAnonKey());
}

export function createSupabaseServerClient(): SupabaseClient {
  return createClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function createSupabaseAdminClient(): SupabaseClient {
  return createClient(getSupabaseUrl(), getSupabaseServiceRoleKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function fetchRecentSignals(
  limit = 50,
  client?: SupabaseClient
): Promise<CompanySignal[]> {
  const supabase = client ?? createSupabaseServerClient();

  const { data, error } = await supabase
    .from("company_signals")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as CompanySignal[];
}

export async function fetchUnprocessedStatements(
  limit = 20,
  client?: SupabaseClient
): Promise<RawStatement[]> {
  const supabase = client ?? createSupabaseAdminClient();

  const { data, error } = await supabase
    .from("raw_statements")
    .select("*")
    .eq("processed", false)
    .order("published_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as RawStatement[];
}

export async function insertRawStatement(
  input: Pick<RawStatement, "source" | "content" | "published_at"> & {
    external_id?: string | null;
  },
  client?: SupabaseClient
): Promise<RawStatement> {
  const supabase = client ?? createSupabaseAdminClient();

  const { data, error } = await supabase
    .from("raw_statements")
    .insert({
      external_id: input.external_id ?? null,
      source: input.source,
      content: input.content,
      published_at: input.published_at,
      processed: false,
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to insert raw statement");
  }

  return data as RawStatement;
}

export async function insertRawStatementIfNew(
  input: Pick<RawStatement, "source" | "content" | "published_at"> & {
    external_id: string;
  },
  client?: SupabaseClient
): Promise<{ row: RawStatement; inserted: boolean }> {
  const supabase = client ?? createSupabaseAdminClient();

  const { data: existing, error: lookupError } = await supabase
    .from("raw_statements")
    .select("*")
    .eq("external_id", input.external_id)
    .maybeSingle();

  if (lookupError) {
    throw new Error(lookupError.message);
  }

  if (existing) {
    return { row: existing as RawStatement, inserted: false };
  }

  const row = await insertRawStatement(input, supabase);
  return { row, inserted: true };
}

export async function insertCompanySignals(
  signals: Omit<CompanySignal, "id" | "created_at">[],
  client?: SupabaseClient
): Promise<CompanySignal[]> {
  if (signals.length === 0) return [];

  const supabase = client ?? createSupabaseAdminClient();

  const { data, error } = await supabase
    .from("company_signals")
    .insert(signals)
    .select("*");

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as CompanySignal[];
}

export async function markStatementProcessed(
  id: string,
  client?: SupabaseClient
): Promise<void> {
  const supabase = client ?? createSupabaseAdminClient();

  const { error } = await supabase
    .from("raw_statements")
    .update({ processed: true })
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }
}
