import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

type Admin = SupabaseClient<Database>;
type QuestionRow = Database["public"]["Tables"]["questions"]["Row"];

export type PublicQuestion = {
  id: string;
  round: number;
  title: string;
  prompt: string;
  code: string | null;
  language: string | null;
  options: string[];
  difficulty: string;
  marks: number;
  category: string | null;
  sample_input: string | null;
  sample_output: string | null;
  constraints: string | null;
};

/** Strips answer keys and hidden test cases before a question reaches a participant. */
export function sanitizeQuestion(q: QuestionRow): PublicQuestion {
  return {
    id: q.id,
    round: q.round,
    title: q.title,
    prompt: q.prompt,
    code: q.code,
    language: q.language,
    options: Array.isArray(q.options) ? (q.options as string[]) : [],
    difficulty: q.difficulty,
    marks: Number(q.marks),
    category: q.category,
    sample_input: q.sample_input,
    sample_output: q.sample_output,
    constraints: q.constraints,
  };
}

export async function assertAdmin(admin: Admin, userId: string) {
  const { data } = await admin.from("user_roles").select("role").eq("user_id", userId);
  if (!data?.some((r) => r.role === "admin")) throw new Error("Forbidden");
}

export async function scoreMcq(admin: Admin, attemptId: string, negative: number) {
  const { data: answers } = await admin
    .from("answers")
    .select("question_id, selected_index")
    .eq("attempt_id", attemptId);

  const { data: questions } = await admin
    .from("questions")
    .select("id, correct_index, marks")
    .eq("round", 1)
    .eq("active", true);

  const byId = new Map((questions ?? []).map((q) => [q.id, q]));
  const answered = new Map((answers ?? []).map((a) => [a.question_id, a.selected_index]));

  let score = 0;
  let maxScore = 0;
  let correct = 0;
  let wrong = 0;
  let skipped = 0;

  for (const q of questions ?? []) {
    maxScore += Number(q.marks);
    const picked = answered.get(q.id);
    if (picked === null || picked === undefined) {
      skipped += 1;
      continue;
    }
    if (picked === q.correct_index) {
      correct += 1;
      score += Number(q.marks);
    } else {
      wrong += 1;
      score -= negative;
    }
  }

  void byId;
  return { score: Math.max(0, Math.round(score * 100) / 100), maxScore, correct, wrong, skipped };
}

export type LeaderboardRow = {
  user_id: string;
  full_name: string;
  register_number: string;
  college: string | null;
  score: number;
  max_score: number;
  duration_seconds: number;
  warnings: number;
  rounds_cleared: number;
  status: string;
};

export async function buildLeaderboard(admin: Admin, round: number): Promise<LeaderboardRow[]> {
  const [{ data: profiles }, { data: attempts }, { data: access }] = await Promise.all([
    admin.from("profiles").select("id, full_name, register_number, college"),
    admin.from("attempts").select("*"),
    admin.from("round_access").select("user_id, round, state"),
  ]);

  const rows: LeaderboardRow[] = (profiles ?? []).map((p) => {
    const mine = (attempts ?? []).filter(
      (a) => a.user_id === p.id && (round === 0 || a.round === round),
    );
    const eliminated = (access ?? []).some((a) => a.user_id === p.id && a.state === "eliminated");
    return {
      user_id: p.id,
      full_name: p.full_name,
      register_number: p.register_number,
      college: p.college,
      score: mine.reduce((s, a) => s + Number(a.score ?? 0), 0),
      max_score: mine.reduce((s, a) => s + Number(a.max_score ?? 0), 0),
      duration_seconds: mine.reduce((s, a) => s + Number(a.duration_seconds ?? 0), 0),
      warnings: mine.reduce((s, a) => s + Number(a.warnings_count ?? 0), 0),
      rounds_cleared: mine.filter((a) => a.status !== "in_progress").length,
      status: eliminated ? "eliminated" : "active",
    };
  });

  return rows
    .filter((r) => r.rounds_cleared > 0)
    .sort(
      (a, b) =>
        b.score - a.score ||
        a.duration_seconds - b.duration_seconds ||
        a.warnings - b.warnings ||
        a.full_name.localeCompare(b.full_name),
    );
}

/** Drops undefined keys so partial payloads satisfy exactOptionalPropertyTypes. */
export function compact<T extends Record<string, unknown>>(obj: T) {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined),
  ) as { [K in keyof T]-?: Exclude<T[K], undefined> };
}

export const settingsInputSchema = z.object({
  event_name: z.string().max(120).optional(),
  round1_minutes: z.number().int().min(1).max(600).optional(),
  round2_minutes: z.number().int().min(1).max(600).optional(),
  round3_minutes: z.number().int().min(1).max(600).optional(),
  max_warnings: z.number().int().min(0).max(20).optional(),
  warning_penalty: z.number().min(0).max(100).optional(),
  negative_marking: z.number().min(0).max(100).optional(),
  auto_submit: z.boolean().optional(),
  leaderboard_public: z.boolean().optional(),
  leaderboard_frozen: z.boolean().optional(),
  results_published: z.boolean().optional(),
  round1_status: z.enum(["pending", "live", "closed"]).optional(),
  round2_status: z.enum(["pending", "live", "closed"]).optional(),
  round3_status: z.enum(["pending", "live", "closed"]).optional(),
});

export const questionInputSchema = z.object({
  id: z.string().uuid().optional(),
  round: z.number().int().min(1).max(3),
  title: z.string().trim().min(1).max(200),
  prompt: z.string().trim().min(1).max(6000),
  code: z.string().max(20000).nullable().optional(),
  language: z.string().max(20).nullable().optional(),
  options: z.array(z.string().max(500)).default([]),
  correct_index: z.number().int().min(0).max(9).nullable().optional(),
  expected_output: z.string().max(4000).nullable().optional(),
  sample_input: z.string().max(4000).nullable().optional(),
  sample_output: z.string().max(4000).nullable().optional(),
  constraints: z.string().max(2000).nullable().optional(),
  test_cases: z.array(z.object({ input: z.string(), expected: z.string() })).default([]),
  difficulty: z.enum(["easy", "medium", "hard"]),
  category: z.string().max(80).default("General"),
  marks: z.number().min(0).max(1000),
  active: z.boolean().default(true),
});
