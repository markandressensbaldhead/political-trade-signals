import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(url, key);

const EXTERNAL_ID = "truth:pltr-endorsement-2026-04-10";
const CONTENT =
  "Palantir Technologies (PLTR) has proven to have great war fighting capabilities and equipment. Just ask our enemies!!! President DJT";
const PUBLISHED_AT = "2026-04-10T16:30:00.000Z";
const SIGNAL_AT = "2026-05-15T14:00:00.000Z";

async function main() {
  const { data: existing } = await supabase
    .from("raw_statements")
    .select("id")
    .eq("external_id", EXTERNAL_ID)
    .maybeSingle();

  let statementId = existing?.id;

  if (!statementId) {
    const { data: row, error } = await supabase
      .from("raw_statements")
      .insert({
        external_id: EXTERNAL_ID,
        source: "Truth Social",
        content: CONTENT,
        published_at: PUBLISHED_AT,
        processed: true,
      })
      .select("id")
      .single();

    if (error) throw new Error(`raw_statements: ${error.message}`);
    statementId = row.id;
    console.log("Inserted raw_statement", statementId);
  }

  const { data: existingSignal } = await supabase
    .from("company_signals")
    .select("id")
    .eq("ticker", "PLTR")
    .maybeSingle();

  if (existingSignal) {
    const { error } = await supabase
      .from("company_signals")
      .update({
        company_name: "Palantir Technologies Inc.",
        sentiment: "bullish",
        confidence: 0.92,
        quote:
          "Palantir Technologies (PLTR) has proven to have great war fighting capabilities and equipment. Just ask our enemies!!!",
        source: "Truth Social",
        created_at: SIGNAL_AT,
      })
      .eq("id", existingSignal.id);

    if (error) throw new Error(`update: ${error.message}`);
    console.log("Updated existing PLTR signal", existingSignal.id);
    return;
  }

  const payload = {
    raw_statement_id: statementId,
    company_name: "Palantir Technologies Inc.",
    ticker: "PLTR",
    sentiment: "bullish",
    confidence: 0.92,
    quote:
      "Palantir Technologies (PLTR) has proven to have great war fighting capabilities and equipment. Just ask our enemies!!!",
    source: "Truth Social",
    created_at: SIGNAL_AT,
  };

  const { data: signal, error } = await supabase
    .from("company_signals")
    .insert(payload)
    .select("*")
    .single();

  if (error) throw new Error(`company_signals: ${error.message}`);

  console.log("Inserted PLTR signal:", signal.id);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
