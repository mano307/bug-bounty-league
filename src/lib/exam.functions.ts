import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { evaluateSubmission } from "./evaluate.server";
import {
  assertAdmin,
  buildLeaderboard,
  questionInputSchema,
  sanitizeQuestion,
  scoreMcq,
  settingsInputSchema,
  compact,
} from "./exam.server";

export const getExamPayload = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { round: number }) =>
    z.object({ round: z.number().int().min(1).max(3) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const userId = context.userId;

    const [{ data: settings }, { data: access }, { data: attempt }, { data: questions }] =
      await Promise.all([
        supabaseAdmin.from("event_settings").select("*").eq("id", 1).single(),
        supabaseAdmin
          .from("round_access")
          .select("*")
          .eq("user_id", userId)
          .eq("round", data.round)
          .maybeSingle(),
        supabaseAdmin
          .from("attempts")
          .select("*")
          .eq("user_id", userId)
          .eq("round", data.round)
          .maybeSingle(),
        supabaseAdmin
          .from("questions")
          .select("*")
          .eq("round", data.round)
          .eq("active", true)
          .order("created_at", { ascending: true }),
      ]);

    // Only expose question content when the round is actually available to this
    // participant (or when the caller is an organiser).
    const { data: isAdmin } = await supabaseAdmin.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });
    const allowedStates = ["unlocked", "in_progress", "submitted", "qualified"];
    const roundAvailable = Boolean(isAdmin) || (!!access && allowedStates.includes(access.state));

    let saved: { question_id: string; selected_index: number | null; code: string | null }[] = [];
    if (attempt && roundAvailable) {
      const { data: rows } = await supabaseAdmin
        .from("answers")
        .select("question_id, selected_index, code")
        .eq("attempt_id", attempt.id);
      saved = rows ?? [];
    }

    return {
      settings,
      access,
      attempt,
      savedAnswers: saved,
      locked: !roundAvailable,
      questions: roundAvailable ? (questions ?? []).map(sanitizeQuestion) : [],
    };
  });


export const startAttempt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { round: number }) =>
    z.object({ round: z.number().int().min(1).max(3) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const userId = context.userId;

    const { data: access } = await supabaseAdmin
      .from("round_access")
      .select("state")
      .eq("user_id", userId)
      .eq("round", data.round)
      .maybeSingle();

    if (!access || !["unlocked", "in_progress"].includes(access.state)) {
      throw new Error("This round is not available to you yet.");
    }

    const { data: existing } = await supabaseAdmin
      .from("attempts")
      .select("*")
      .eq("user_id", userId)
      .eq("round", data.round)
      .maybeSingle();

    if (existing) return existing;

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("full_name, register_number")
      .eq("id", userId)
      .maybeSingle();

    const { data: created, error } = await supabaseAdmin
      .from("attempts")
      .insert({ user_id: userId, round: data.round, status: "in_progress" })
      .select("*")
      .single();
    if (error) throw new Error(error.message);

    await supabaseAdmin
      .from("round_access")
      .update({ state: "in_progress", updated_at: new Date().toISOString() })
      .eq("user_id", userId)
      .eq("round", data.round);

    await supabaseAdmin.from("activity_log").insert({
      user_id: userId,
      actor_name: profile?.full_name ?? "",
      register_number: profile?.register_number ?? "",
      event_type: "round_started",
      round: data.round,
      detail: `Started Round ${data.round}`,
    });

    return created;
  });

export const saveAnswer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      round: number;
      question_id: string;
      selected_index?: number | null;
      code?: string;
    }) =>
      z
        .object({
          round: z.number().int().min(1).max(3),
          question_id: z.string().uuid(),
          selected_index: z.number().int().nullable().optional(),
          code: z.string().max(60000).optional(),
        })
        .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: attempt } = await supabaseAdmin
      .from("attempts")
      .select("id, status")
      .eq("user_id", context.userId)
      .eq("round", data.round)
      .maybeSingle();
    if (!attempt || attempt.status !== "in_progress") throw new Error("No active attempt.");

    await supabaseAdmin.from("answers").upsert(
      {
        attempt_id: attempt.id,
        user_id: context.userId,
        question_id: data.question_id,
        selected_index: data.selected_index ?? null,
        code: data.code ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "attempt_id,question_id" },
    );
    return { ok: true };
  });

export const submitAttempt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      round: number;
      code?: string;
      language?: string;
      question_id?: string;
      auto_submitted?: boolean;
      auto_reason?: "warnings" | "time";
    }) =>
      z
        .object({
          round: z.number().int().min(1).max(3),
          code: z.string().max(60000).optional(),
          language: z.string().max(20).optional(),
          question_id: z.string().uuid().optional(),
          auto_submitted: z.boolean().optional(),
          auto_reason: z.enum(["warnings", "time"]).optional(),
        })
        .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const userId = context.userId;

    const { data: attempt } = await supabaseAdmin
      .from("attempts")
      .select("*")
      .eq("user_id", userId)
      .eq("round", data.round)
      .maybeSingle();
    if (!attempt) throw new Error("No attempt to submit.");
    if (attempt.status !== "in_progress") return attempt;

    const [{ data: settings }, { count: warningCount }, { data: profile }] = await Promise.all([
      supabaseAdmin.from("event_settings").select("*").eq("id", 1).single(),
      supabaseAdmin
        .from("warnings")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("round", data.round),
      supabaseAdmin.from("profiles").select("full_name, register_number").eq("id", userId).maybeSingle(),
    ]);

    const now = new Date();
    const started = new Date(attempt.started_at);
    const duration = Math.max(0, Math.round((now.getTime() - started.getTime()) / 1000));
    const warnings = warningCount ?? 0;
    const penalty = Number(settings?.warning_penalty ?? 0) * warnings;

    let score = 0;
    let maxScore = 0;
    let correct = 0;
    let wrong = 0;
    let skipped = 0;
    let aiReport: unknown = null;

    if (data.round === 1) {
      const result = await scoreMcq(supabaseAdmin, attempt.id, Number(settings?.negative_marking ?? 0));
      ({ score, maxScore, correct, wrong, skipped } = result);
    } else {
      const { data: question } = data.question_id
        ? await supabaseAdmin.from("questions").select("*").eq("id", data.question_id).maybeSingle()
        : await supabaseAdmin
            .from("questions")
            .select("*")
            .eq("round", data.round)
            .eq("active", true)
            .order("created_at")
            .limit(1)
            .maybeSingle();

      maxScore = Number(question?.marks ?? 0);
      if (question && data.code && data.code.trim().length > 0) {
        try {
          const report = await evaluateSubmission(question, data.code, data.language ?? "python");
          aiReport = report;
          score = Math.round(((report.final_percentage ?? 0) / 100) * maxScore * 100) / 100;
          correct = report.test_cases.filter((t) => t.passed).length;
          wrong = report.test_cases.length - correct;
        } catch (err) {
          aiReport = { error: err instanceof Error ? err.message : "Evaluation failed" };
        }
      } else {
        skipped = 1;
      }
    }

    const finalScore = Math.max(0, score - penalty);

    const { data: updated, error } = await supabaseAdmin
      .from("attempts")
      .update({
        submitted_at: now.toISOString(),
        duration_seconds: duration,
        score: finalScore,
        max_score: maxScore,
        correct_count: correct,
        wrong_count: wrong,
        skipped_count: skipped,
        warnings_count: warnings,
        status: data.auto_submitted ? "auto_submitted" : "submitted",
        language: data.language ?? null,
        code: data.code ?? null,
        ai_report: aiReport as never,
      })
      .eq("id", attempt.id)
      .select("*")
      .single();
    if (error) throw new Error(error.message);

    await supabaseAdmin
      .from("round_access")
      .update({ state: "submitted", updated_at: now.toISOString() })
      .eq("user_id", userId)
      .eq("round", data.round);

    await supabaseAdmin.from("activity_log").insert({
      user_id: userId,
      actor_name: profile?.full_name ?? "",
      register_number: profile?.register_number ?? "",
      event_type: data.auto_submitted ? "auto_submitted" : "submitted",
      round: data.round,
      detail: data.auto_submitted
        ? `Auto-submitted Round ${data.round} ${
            data.auto_reason === "warnings"
              ? `due to warning limit (${warnings} warnings)`
              : "— time expired"
          } · ${finalScore}/${maxScore}`
        : `Submitted Round ${data.round} · ${finalScore}/${maxScore}`,
    });

    return updated;
  });

export const getMyProgress = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [{ data: access }, { data: attempts }, { data: settings }, { data: announcements }] =
      await Promise.all([
        supabaseAdmin.from("round_access").select("*").eq("user_id", context.userId).order("round"),
        supabaseAdmin.from("attempts").select("*").eq("user_id", context.userId).order("round"),
        supabaseAdmin.from("event_settings").select("*").eq("id", 1).single(),
        supabaseAdmin
          .from("announcements")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(5),
      ]);
    return { access: access ?? [], attempts: attempts ?? [], settings, announcements: announcements ?? [] };
  });

export const getLeaderboard = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { round: number }) =>
    z.object({ round: z.number().int().min(0).max(3) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: settings } = await supabaseAdmin
      .from("event_settings")
      .select("leaderboard_public, leaderboard_frozen")
      .eq("id", 1)
      .single();

    const { data: roles } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId);
    const isAdmin = Boolean(roles?.some((r) => r.role === "admin"));

    if (!settings?.leaderboard_public && !isAdmin) {
      return { visible: false as const, rows: [] };
    }
    const rows = await buildLeaderboard(supabaseAdmin, data.round);
    return { visible: true as const, rows };
  });

export const claimFirstAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { count } = await supabaseAdmin
      .from("user_roles")
      .select("id", { count: "exact", head: true })
      .eq("role", "admin");
    if ((count ?? 0) > 0) throw new Error("An administrator already exists for this event.");
    const { error } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: context.userId, role: "admin" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminOverview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await assertAdmin(supabaseAdmin, context.userId);

    const [
      { data: profiles },
      { data: attempts },
      { data: access },
      { data: warnings },
      { data: activity },
      { data: settings },
      { data: questions },
    ] = await Promise.all([
      supabaseAdmin.from("profiles").select("*").order("created_at"),
      supabaseAdmin.from("attempts").select("*"),
      supabaseAdmin.from("round_access").select("*"),
      supabaseAdmin.from("warnings").select("*").order("created_at", { ascending: false }).limit(300),
      supabaseAdmin
        .from("activity_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(120),
      supabaseAdmin.from("event_settings").select("*").eq("id", 1).single(),
      supabaseAdmin.from("questions").select("*").order("round").order("created_at"),
    ]);

    return {
      profiles: profiles ?? [],
      attempts: attempts ?? [],
      access: access ?? [],
      warnings: warnings ?? [],
      activity: activity ?? [],
      settings,
      questions: questions ?? [],
    };
  });

export const adminUpdateSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => settingsInputSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await assertAdmin(supabaseAdmin, context.userId);
    const { error } = await supabaseAdmin
      .from("event_settings")
      .update({ ...compact(data), updated_at: new Date().toISOString() })
      .eq("id", 1);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminSetRoundState = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: { user_ids: string[]; round: number; state: string }) =>
      z
        .object({
          user_ids: z.array(z.string().uuid()).min(1),
          round: z.number().int().min(1).max(3),
          state: z.enum(["locked", "unlocked", "eliminated", "qualified"]),
        })
        .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await assertAdmin(supabaseAdmin, context.userId);

    const rows = data.user_ids.map((id) => ({
      user_id: id,
      round: data.round,
      state: data.state as never,
      updated_at: new Date().toISOString(),
    }));
    const { error } = await supabaseAdmin
      .from("round_access")
      .upsert(rows, { onConflict: "user_id,round" });
    if (error) throw new Error(error.message);

    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, register_number")
      .in("id", data.user_ids);

    await supabaseAdmin.from("activity_log").insert(
      (profiles ?? []).map((p) => ({
        user_id: p.id,
        actor_name: p.full_name,
        register_number: p.register_number,
        event_type: data.state === "eliminated" ? "eliminated" : "promoted",
        round: data.round,
        detail:
          data.state === "eliminated"
            ? `Eliminated before Round ${data.round}`
            : `Round ${data.round} unlocked`,
      })),
    );
    return { ok: true };
  });

export const adminBroadcast = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { message: string }) =>
    z.object({ message: z.string().trim().min(1).max(400) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await assertAdmin(supabaseAdmin, context.userId);
    const { error } = await supabaseAdmin.from("announcements").insert({ message: data.message });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminSaveQuestion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => questionInputSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await assertAdmin(supabaseAdmin, context.userId);
    const { id, ...rest } = data;
    const fields = compact(rest);
    if (id) {
      const { error } = await supabaseAdmin.from("questions").update(fields).eq("id", id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabaseAdmin.from("questions").insert(fields);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const adminDeleteQuestion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await assertAdmin(supabaseAdmin, context.userId);
    const { error } = await supabaseAdmin.from("questions").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminOverrideScore = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { attempt_id: string; manual_score: number; judge_remarks: string }) =>
    z
      .object({
        attempt_id: z.string().uuid(),
        manual_score: z.number().min(0),
        judge_remarks: z.string().max(1000),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await assertAdmin(supabaseAdmin, context.userId);
    const { error } = await supabaseAdmin
      .from("attempts")
      .update({
        manual_score: data.manual_score,
        score: data.manual_score,
        judge_remarks: data.judge_remarks,
      })
      .eq("id", data.attempt_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminReevaluate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { attempt_id: string }) =>
    z.object({ attempt_id: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await assertAdmin(supabaseAdmin, context.userId);

    const { data: attempt } = await supabaseAdmin
      .from("attempts")
      .select("*")
      .eq("id", data.attempt_id)
      .maybeSingle();
    if (!attempt?.code) throw new Error("No code submitted for this attempt.");

    const { data: question } = await supabaseAdmin
      .from("questions")
      .select("*")
      .eq("round", attempt.round)
      .eq("active", true)
      .order("created_at")
      .limit(1)
      .maybeSingle();
    if (!question) throw new Error("No question configured for this round.");

    const report = await evaluateSubmission(question, attempt.code, attempt.language ?? "python");
    const score =
      Math.round(((report.final_percentage ?? 0) / 100) * Number(attempt.max_score) * 100) / 100;

    const { error } = await supabaseAdmin
      .from("attempts")
      .update({ ai_report: report as never, score, manual_score: null })
      .eq("id", attempt.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Participant-facing debug tool: dry-runs the current code against the question's
 *  test cases without scoring or consuming the attempt. Rounds 2 and 3 only. */
export const debugCheck = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: { round: number; question_id: string; code: string; language: string }) =>
      z
        .object({
          round: z.number().int().min(2).max(3),
          question_id: z.string().uuid(),
          code: z.string().min(1).max(60000),
          language: z.string().max(20),
        })
        .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: attempt } = await supabaseAdmin
      .from("attempts")
      .select("id, status")
      .eq("user_id", context.userId)
      .eq("round", data.round)
      .maybeSingle();
    if (!attempt || attempt.status !== "in_progress") throw new Error("No active attempt.");

    const { data: question } = await supabaseAdmin
      .from("questions")
      .select("*")
      .eq("id", data.question_id)
      .eq("round", data.round)
      .maybeSingle();
    if (!question) throw new Error("Question not found.");

    const report = await evaluateSubmission(question, data.code, data.language);
    const total = report.test_cases.length;
    const passed = report.test_cases.filter((t) => t.passed).length;

    return {
      passed,
      total,
      all_passed: total > 0 && passed === total,
      test_cases: report.test_cases,
      issues: report.bugs_found,
      summary: report.summary,
    };
  });

/** Admin: full answer sheet for a single attempt. */
export const adminGetAttemptDetail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { attempt_id: string }) =>
    z.object({ attempt_id: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await assertAdmin(supabaseAdmin, context.userId);

    const { data: attempt } = await supabaseAdmin
      .from("attempts")
      .select("*")
      .eq("id", data.attempt_id)
      .maybeSingle();
    if (!attempt) throw new Error("Attempt not found.");

    const [{ data: profile }, { data: answers }, { data: questions }] = await Promise.all([
      supabaseAdmin
        .from("profiles")
        .select("full_name, register_number, department, year, section")
        .eq("id", attempt.user_id)
        .maybeSingle(),
      supabaseAdmin
        .from("answers")
        .select("question_id, selected_index, code, updated_at")
        .eq("attempt_id", attempt.id),
      supabaseAdmin
        .from("questions")
        .select("id, title, prompt, options, correct_index, marks, language, code")
        .eq("round", attempt.round),
    ]);

    const byId = new Map((questions ?? []).map((q) => [q.id, q]));
    const rows = (answers ?? []).map((a) => {
      const q = byId.get(a.question_id);
      const options = Array.isArray(q?.options) ? (q?.options as string[]) : [];
      return {
        question_id: a.question_id,
        title: q?.title ?? "Question",
        prompt: q?.prompt ?? "",
        options,
        correct_index: q?.correct_index ?? null,
        marks: Number(q?.marks ?? 0),
        language: q?.language ?? attempt.language ?? null,
        starter_code: q?.code ?? null,
        selected_index: a.selected_index,
        code: a.code,
        updated_at: a.updated_at,
        is_correct:
          a.selected_index !== null && q?.correct_index !== null && q?.correct_index !== undefined
            ? a.selected_index === q.correct_index
            : null,
      };
    });

    return {
      attempt,
      profile,
      answers: rows.sort((a, b) => a.title.localeCompare(b.title)),
    };
  });
