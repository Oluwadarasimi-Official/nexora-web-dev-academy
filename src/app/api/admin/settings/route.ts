import { NextResponse } from "next/server";
import { requireAdmin, logAdmin } from "@/lib/adminApi";

// Academy settings, read from and written to the academy_settings table.
// GET returns the stored values with the documented defaults for any key
// not yet stored. POST updates one key. Admin only. Changes are logged.
// The values ARE enforced server-side (fix pass C, B9): quiz-submit reads
// quiz_pass_mark, complete-topic reads daily_new_topic_limit, and the
// exam grading route reads exam_pass_mark_percent. Student pages display
// the same numbers via GET /api/settings.
const DEFAULTS: Record<string, string> = {
  daily_new_topic_limit: "3",
  timezone: "Africa/Lagos",
  quiz_pass_mark: "7",
  exam_pass_mark_percent: "70",
  payment_whatsapp: "+234 813 938 8562",
};
const NUMERIC_KEYS: Record<string, [number, number]> = {
  daily_new_topic_limit: [1, 10],
  quiz_pass_mark: [1, 10],
  exam_pass_mark_percent: [1, 100],
};

export async function GET(req: Request) {
  const guard = await requireAdmin(req);
  if ("error" in guard) return guard.error;
  const { client } = guard.ctx;
  try {
    const { data, error } = await client
      .from("academy_settings")
      .select("key,value");
    if (error)
      return NextResponse.json(
        { error: "Could not load settings." },
        { status: 500 }
      );
    const values: Record<string, string> = { ...DEFAULTS };
    for (const row of data ?? []) values[row.key] = row.value;
    return NextResponse.json({ settings: values });
  } catch {
    return NextResponse.json(
      { error: "Could not load settings." },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const guard = await requireAdmin(req);
  if ("error" in guard) return guard.error;
  const { client, user } = guard.ctx;
  try {
    const body = await req.json();
    const key = String(body.key || "");
    const value = String(body.value ?? "").trim().slice(0, 200);
    if (!(key in DEFAULTS))
      return NextResponse.json(
        { error: "Unknown setting." },
        { status: 400 }
      );
    if (key in NUMERIC_KEYS) {
      const n = Number(value);
      const [min, max] = NUMERIC_KEYS[key];
      if (!Number.isInteger(n) || n < min || n > max)
        return NextResponse.json(
          { error: `Enter a whole number between ${min} and ${max}.` },
          { status: 400 }
        );
    }
    if (!value)
      return NextResponse.json(
        { error: "A value is required." },
        { status: 400 }
      );
    const { error } = await client
      .from("academy_settings")
      .upsert({ key, value }, { onConflict: "key" });
    if (error)
      return NextResponse.json(
        { error: "Could not save the setting." },
        { status: 500 }
      );
    await logAdmin(
      client,
      user.id,
      "setting_updated",
      "academy_setting",
      key,
      `${key} = ${value}`
    );
    return NextResponse.json({ ok: true, key, value });
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}
