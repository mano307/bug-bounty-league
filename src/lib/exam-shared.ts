import { z } from "zod";

export const ROUND_NAMES: Record<number, string> = {
  1: "Multiple Choice",
  2: "Error Spotting",
  3: "Live Debugging",
};

export const LANGUAGES = ["python", "java", "javascript"] as const;

export const roundSchema = z.object({ round: z.number().int().min(1).max(3) });

export const submitSchema = z.object({
  round: z.number().int().min(1).max(3),
  answers: z.array(z.object({ question_id: z.string().uuid(), selected_index: z.number().int().nullable() })).optional(),
  code: z.string().max(60000).optional(),
  language: z.string().max(20).optional(),
  question_id: z.string().uuid().optional(),
  auto_submitted: z.boolean().optional(),
});

export const aiReportSchema = z.object({
  correctness_score: z.number(),
  quality_score: z.number(),
  performance_score: z.number(),
  debugging_score: z.number(),
  best_practices_score: z.number(),
  test_cases: z.array(
    z.object({ name: z.string(), passed: z.boolean(), note: z.string() }),
  ),
  bugs_found: z.array(z.object({ issue: z.string(), severity: z.string(), fix: z.string() })),
  estimated_time_complexity: z.string(),
  estimated_space_complexity: z.string(),
  quality_rating: z.string(),
  recommendations: z.array(z.string()),
  summary: z.string(),
});

export type AIReport = z.infer<typeof aiReportSchema> & { final_percentage?: number };

/** Weighted rubric — mirrors the admin-facing scoring weights. */
export const RUBRIC = {
  correctness: 0.5,
  tests: 0.2,
  quality: 0.1,
  performance: 0.1,
  debugging: 0.05,
  practices: 0.05,
};

export function rubricPercentage(r: z.infer<typeof aiReportSchema>) {
  const testRate = r.test_cases.length
    ? (r.test_cases.filter((t) => t.passed).length / r.test_cases.length) * 100
    : r.correctness_score;
  const pct =
    r.correctness_score * RUBRIC.correctness +
    testRate * RUBRIC.tests +
    r.quality_score * RUBRIC.quality +
    r.performance_score * RUBRIC.performance +
    r.debugging_score * RUBRIC.debugging +
    r.best_practices_score * RUBRIC.practices;
  return Math.max(0, Math.min(100, Math.round(pct)));
}

export function formatDuration(seconds: number | null | undefined) {
  if (seconds === null || seconds === undefined) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${String(s).padStart(2, "0")}s`;
}

export function formatClock(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

/** Deterministic per-participant shuffle so a reload keeps the same order. */
export function seededShuffle<T>(items: T[], seed: string): T[] {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const rand = () => {
    h ^= h << 13;
    h ^= h >>> 17;
    h ^= h << 5;
    return Math.abs(h) / 2147483647;
  };
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1)) % (i + 1);
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}
