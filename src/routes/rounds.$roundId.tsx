import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  Bug,
  CheckCircle2,
  Clock,
  Loader2,
  Save,
  Send,
  ShieldAlert,
  Terminal,
  XCircle,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useAntiCheat } from "@/lib/anti-cheat";
import {
  debugCheck,
  getExamPayload,
  saveAnswer,
  startAttempt,
  submitAttempt,
} from "@/lib/exam.functions";
import { LANGUAGES, ROUND_NAMES, formatClock, seededShuffle } from "@/lib/exam-shared";

type DebugResult = {
  passed: number;
  total: number;
  all_passed: boolean;
  test_cases: { name: string; passed: boolean; note: string }[];
  issues: { issue: string; severity: string; fix: string }[];
  summary: string;
};

import { CodeEditor } from "@/components/code-editor";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/rounds/$roundId")({
  head: () => ({
    meta: [
      { title: "Competition Round — DebugX" },
      {
        name: "description",
        content:
          "Proctored DebugX competition round with live timer, anti-cheat monitoring and instant submission.",
      },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Competition Round — DebugX" },
      { property: "og:description", content: "Proctored DebugX competition round." },
    ],
  }),
  component: RoundPage,
});

function RoundPage() {
  const { roundId } = Route.useParams();
  const round = Number(roundId);
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();

  const loadPayload = useServerFn(getExamPayload);
  const begin = useServerFn(startAttempt);
  const persist = useServerFn(saveAnswer);
  const finish = useServerFn(submitAttempt);

  const runDebug = useServerFn(debugCheck);

  const [started, setStarted] = useState(false);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [codes, setCodes] = useState<Record<string, string>>({});
  const [language, setLanguage] = useState<string>("python");
  const [index, setIndex] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const [submitting, setSubmitting] = useState(false);
  const [savingCode, setSavingCode] = useState(false);
  const [debugging, setDebugging] = useState(false);
  const [debugResult, setDebugResult] = useState<DebugResult | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const submittedRef = useRef(false);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth", replace: true });
  }, [loading, user, navigate]);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["exam", round, user?.id],
    queryFn: () => loadPayload({ data: { round } }),
    enabled: Boolean(user) && round >= 1 && round <= 3,
  });

  const settings = data?.settings;
  const maxWarnings = settings?.max_warnings ?? 3;
  const minutes =
    round === 1
      ? (settings?.round1_minutes ?? 20)
      : round === 2
        ? (settings?.round2_minutes ?? 25)
        : (settings?.round3_minutes ?? 30);

  const questions = useMemo(() => {
    const list = data?.questions ?? [];
    if (round !== 1) return list;
    return seededShuffle(list, user?.id ?? "seed");
  }, [data?.questions, round, user?.id]);

  const current = questions[index];
  const code = current ? (codes[current.id] ?? current.code ?? "") : "";
  const setCode = useCallback(
    (value: string) => {
      if (!current) return;
      setCodes((prev) => ({ ...prev, [current.id]: value }));
    },
    [current],
  );

  // hydrate saved work
  useEffect(() => {
    if (!data) return;
    const map: Record<string, number> = {};
    const codeMap: Record<string, string> = {};
    for (const a of data.savedAnswers) {
      if (a.selected_index !== null) map[a.question_id] = a.selected_index;
      if (a.code) codeMap[a.question_id] = a.code;
    }
    setAnswers(map);
    setCodes(codeMap);
    if (data.attempt?.status === "in_progress") setStarted(true);
  }, [data]);

  // switching question resets the debug panel and follows the question language
  useEffect(() => {
    setDebugResult(null);
    if (round !== 1 && current?.language) setLanguage(current.language);
  }, [current, round]);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  // track full-screen state — answering is blocked whenever it is exited
  const [isFullscreen, setIsFullscreen] = useState(true);
  useEffect(() => {
    const sync = () => setIsFullscreen(Boolean(document.fullscreenElement));
    sync();
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);


  const deadline = data?.attempt?.started_at
    ? new Date(data.attempt.started_at).getTime() + minutes * 60_000
    : null;
  const remaining = deadline ? deadline - now : minutes * 60_000;

  const doSubmit = useCallback(
    async (auto: boolean, reason: "warnings" | "time" = "time") => {
      if (submittedRef.current) return;
      submittedRef.current = true;
      setSubmitting(true);
      try {
        if (round !== 1 && current) {
          await persist({ data: { round, question_id: current.id, code } }).catch(() => {});
        }
        await finish({
          data: {
            round,
            auto_submitted: auto,
            ...(auto ? { auto_reason: reason } : {}),
            ...(round === 1
              ? {}
              : { code, language, ...(current ? { question_id: current.id } : {}) }),
          },
        });
        if (document.fullscreenElement) await document.exitFullscreen().catch(() => {});
        toast.success(
          auto
            ? reason === "warnings"
              ? "Auto-submitted — warning limit reached"
              : "Time up — attempt submitted"
            : "Attempt submitted",
        );
        navigate({ to: "/results" });
      } catch (err) {
        submittedRef.current = false;
        toast.error(err instanceof Error ? err.message : "Could not submit");
      } finally {
        setSubmitting(false);
      }
    },
    [finish, persist, round, code, language, current, navigate],
  );

  const { warnings } = useAntiCheat({
    userId: user?.id,
    round,
    maxWarnings,
    active: started && !submittedRef.current,
    onLimitExceeded: () => void doSubmit(true, "warnings"),
    actorName: profile?.full_name ?? "",
    registerNumber: profile?.register_number ?? "",
  });

  // auto-submit on expiry
  useEffect(() => {
    if (!started || !deadline || submittedRef.current) return;
    if (remaining <= 0 && (settings?.auto_submit ?? true)) void doSubmit(true, "time");
  }, [remaining, started, deadline, settings?.auto_submit, doSubmit]);

  // periodic autosave for code rounds
  useEffect(() => {
    if (!started || round === 1 || !current) return;
    const t = setInterval(() => {
      void persist({ data: { round, question_id: current.id, code } }).catch(() => {});
    }, 20000);
    return () => clearInterval(t);
  }, [started, round, current, code, persist]);

  async function handleStart() {
    try {
      await begin({ data: { round } });
      await document.documentElement.requestFullscreen().catch(() => {});
      setStarted(true);
      await refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not start this round");
    }
  }

  function pick(questionId: string, optionIndex: number) {
    setAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
    void persist({ data: { round, question_id: questionId, selected_index: optionIndex } }).catch(
      () => {},
    );
  }

  async function handleSaveCode() {
    if (!current) return;
    setSavingCode(true);
    try {
      await persist({ data: { round, question_id: current.id, code } });
      toast.success(`Saved answer for Q${index + 1}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save this answer");
    } finally {
      setSavingCode(false);
    }
  }

  async function handleDebug() {
    if (!current) return;
    if (!code.trim()) {
      toast.error("Write some code before running the debugger");
      return;
    }
    setDebugging(true);
    setDebugResult(null);
    try {
      await persist({ data: { round, question_id: current.id, code } }).catch(() => {});
      const result = await runDebug({
        data: { round, question_id: current.id, code, language },
      });
      setDebugResult(result as DebugResult);
      if (result.all_passed) toast.success("All checks passed");
      else toast.warning(`${result.passed}/${result.total} checks passed`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Debug check failed");
    } finally {
      setDebugging(false);
    }
  }

  if (isLoading || loading) {
    return (
      <div className="hero-bg grid min-h-screen place-items-center">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  if (round < 1 || round > 3) {
    return <Notice title="Unknown round" body="That round does not exist." />;
  }

  const state = data?.access?.state ?? "locked";
  if (data?.attempt && data.attempt.status !== "in_progress") {
    return (
      <Notice
        title="Round already submitted"
        body="Your attempt for this round is locked. Head to your results to review it."
        action={{ label: "View results", to: "/results" }}
      />
    );
  }
  if (!["unlocked", "in_progress"].includes(state)) {
    return (
      <Notice
        title="Round locked"
        body={
          state === "eliminated"
            ? "You were not promoted to this round."
            : "The control room has not unlocked this round for you yet."
        }
        action={{ label: "Back to dashboard", to: "/dashboard" }}
      />
    );
  }

  if (!started) {
    return (
      <div className="hero-bg grid min-h-screen place-items-center px-4 py-12">
        <div className="glass w-full max-w-xl rounded-lg p-8">
          <span className="grid size-10 place-items-center rounded-md bg-primary/10 text-primary">
            <Terminal className="size-5" />
          </span>
          <p className="mt-4 font-mono text-xs uppercase tracking-[0.3em] text-primary">
            Round {round}
          </p>
          <h1 className="mt-1 text-2xl font-bold">{ROUND_NAMES[round]}</h1>
          <ul className="mt-5 space-y-2 text-sm text-muted-foreground">
            <li>› Duration: {minutes} minutes. The timer starts the moment you begin.</li>
            <li>› {questions.length} question{questions.length === 1 ? "" : "s"} in this round.</li>
            <li>› Full-screen is enforced. Tab switching, copy, paste and right-click are logged.</li>
            <li>› {maxWarnings} warnings allowed — the next violation submits your attempt.</li>
          </ul>
          <div className="mt-6 flex gap-3">
            <Button onClick={handleStart} className="flex-1">
              Begin round
            </Button>
            <Button variant="outline" onClick={() => navigate({ to: "/dashboard" })}>
              Cancel
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const answeredCount = Object.keys(answers).length;
  const critical = remaining <= 60_000;

  return (
    <div className="hero-bg flex min-h-screen flex-col select-none">
      {!isFullscreen ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-background/95 px-4 backdrop-blur">
          <div className="glass w-full max-w-md rounded-lg p-8 text-center">
            <span className="mx-auto grid size-10 place-items-center rounded-md bg-warning/10 text-warning">
              <ShieldAlert className="size-5" />
            </span>
            <h2 className="mt-4 text-xl font-bold">Full screen required</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Answering is paused because you left full screen. Return to full screen to continue —
              the timer keeps running and this exit has been logged.
            </p>
            <Button
              className="mt-6 w-full"
              onClick={() =>
                void document.documentElement.requestFullscreen().catch(() => {
                  toast.error("Your browser blocked full screen — press F11 to continue");
                })
              }
            >
              Return to full screen
            </Button>
          </div>
        </div>
      ) : null}

      <header className="sticky top-0 z-20 border-b border-border/60 bg-background/85 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="live-dot" />
            <div>
              <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                Round {round} · {ROUND_NAMES[round]}
              </p>
              <p className="text-sm font-medium">{profile?.full_name ?? "Participant"}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="border-warning/50 text-warning">
              <AlertTriangle className="size-3.5" /> {warnings}/{maxWarnings}
            </Badge>
            <span
              className={`flex items-center gap-2 rounded-md border px-3 py-1.5 font-mono text-sm ${
                critical
                  ? "animate-pulse border-destructive/60 text-destructive"
                  : "border-border/60 text-primary"
              }`}
            >
              <Clock className="size-4" /> {formatClock(remaining)}
            </span>
            <Button size="sm" onClick={() => setConfirmOpen(true)} disabled={submitting}>
              {submitting ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
              Submit
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6">
        {questions.length === 0 ? (
          <p className="glass rounded-lg p-6 text-sm text-muted-foreground">
            No questions are configured for this round yet.
          </p>
        ) : round === 1 ? (
          <div className="grid gap-6 lg:grid-cols-[1fr_260px]">
            <article className="glass rounded-lg p-6">
              <div className="flex items-center justify-between">
                <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                  Question {index + 1} of {questions.length}
                </p>
                <Badge variant="outline">{current?.difficulty}</Badge>
              </div>
              <h2 className="mt-3 text-lg font-semibold">{current?.title}</h2>
              <p className="mt-2 whitespace-pre-wrap text-sm text-foreground/90">{current?.prompt}</p>
              {current?.code ? (
                <pre className="mt-4 overflow-x-auto rounded-md border border-border/60 bg-surface-2/60 p-4 font-mono text-xs leading-relaxed">
                  {current.code}
                </pre>
              ) : null}

              <div className="mt-5 space-y-2">
                {(current?.options ?? []).map((opt, i) => {
                  const selected = current ? answers[current.id] === i : false;
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => current && pick(current.id, i)}
                      className={`flex w-full items-start gap-3 rounded-md border p-3 text-left text-sm transition-colors ${
                        selected
                          ? "border-primary/70 bg-primary/10 text-foreground"
                          : "border-border/60 hover:border-primary/40 hover:bg-surface-2/50"
                      }`}
                    >
                      <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded border border-current font-mono text-[10px]">
                        {String.fromCharCode(65 + i)}
                      </span>
                      <span className="font-mono">{opt}</span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 flex justify-between">
                <Button
                  variant="outline"
                  disabled={index === 0}
                  onClick={() => setIndex((i) => Math.max(0, i - 1))}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  disabled={index >= questions.length - 1}
                  onClick={() => setIndex((i) => Math.min(questions.length - 1, i + 1))}
                >
                  Next
                </Button>
              </div>
            </article>

            <aside className="glass h-fit rounded-lg p-5">
              <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                Answer sheet
              </p>
              <p className="mt-1 text-sm">
                <span className="font-mono text-primary">{answeredCount}</span> of {questions.length}{" "}
                answered
              </p>
              <div className="mt-4 grid grid-cols-6 gap-2">
                {questions.map((q, i) => {
                  const done = answers[q.id] !== undefined;
                  return (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => setIndex(i)}
                      className={`grid size-8 place-items-center rounded border font-mono text-xs transition-colors ${
                        i === index
                          ? "border-primary bg-primary/20 text-primary"
                          : done
                            ? "border-success/60 bg-success/10 text-success"
                            : "border-border/60 text-muted-foreground hover:border-primary/40"
                      }`}
                    >
                      {i + 1}
                    </button>
                  );
                })}
              </div>
              <p className="mt-4 flex items-start gap-2 text-xs text-muted-foreground">
                <ShieldAlert className="mt-0.5 size-3.5 shrink-0 text-warning" />
                Answers save automatically as you select them.
              </p>
            </aside>
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-[400px_1fr]">
            <article className="glass max-h-[calc(100vh-11rem)] overflow-y-auto rounded-lg p-5">
              <div className="flex items-center justify-between">
                <Badge variant="outline">{current?.category ?? "Debugging"}</Badge>
                <Badge variant="outline">{current?.difficulty}</Badge>
              </div>
              <h2 className="mt-3 text-lg font-semibold">{current?.title}</h2>
              <p className="mt-2 whitespace-pre-wrap text-sm text-foreground/90">{current?.prompt}</p>
              {current?.sample_input ? (
                <Block label="Sample input" body={current.sample_input} />
              ) : null}
              {current?.sample_output ? (
                <Block label="Sample output" body={current.sample_output} />
              ) : null}
              {current?.constraints ? (
                <Block label="Constraints" body={current.constraints} />
              ) : null}
              {questions.length > 1 ? (
                <div className="mt-5 flex flex-wrap gap-2">
                  {questions.map((q, i) => (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => setIndex(i)}
                      className={`rounded border px-2 py-1 font-mono text-xs ${
                        i === index
                          ? "border-primary text-primary"
                          : codes[q.id]
                            ? "border-success/60 text-success"
                            : "border-border/60 text-muted-foreground"
                      }`}
                    >
                      Q{i + 1}
                    </button>
                  ))}
                </div>
              ) : null}
            </article>

            <div className="glass flex h-[calc(100vh-11rem)] flex-col overflow-hidden rounded-lg">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 px-4 py-2">
                <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                  editor · Q{index + 1} · {language}
                </p>
                <div className="flex items-center gap-2">
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="rounded border border-border/60 bg-surface-2 px-2 py-1 font-mono text-xs text-foreground"
                  >
                    {LANGUAGES.map((l) => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                  </select>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={debugging}
                    onClick={() => void handleDebug()}
                  >
                    {debugging ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Bug className="size-3.5" />
                    )}
                    Run debug check
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={savingCode}
                    onClick={() => void handleSaveCode()}
                  >
                    {savingCode ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Save className="size-3.5" />
                    )}
                    Save answer
                  </Button>
                </div>
              </div>
              <div className="min-h-[45%] flex-1">
                <CodeEditor value={code} language={language} onChange={setCode} />
              </div>
              {debugResult ? (
                <div className="max-h-[38%] overflow-y-auto border-t border-border/60 bg-surface-2/40 p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                      debug console
                    </p>
                    <Badge
                      variant="outline"
                      className={
                        debugResult.all_passed
                          ? "border-success/60 text-success"
                          : "border-warning/60 text-warning"
                      }
                    >
                      {debugResult.passed}/{debugResult.total} checks passed
                    </Badge>
                  </div>
                  <p className="mt-2 text-xs text-foreground/90">{debugResult.summary}</p>
                  <ul className="mt-3 space-y-1.5">
                    {debugResult.test_cases.map((t, i) => (
                      <li key={i} className="flex items-start gap-2 font-mono text-xs">
                        {t.passed ? (
                          <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-success" />
                        ) : (
                          <XCircle className="mt-0.5 size-3.5 shrink-0 text-destructive" />
                        )}
                        <span className="text-muted-foreground">
                          <span className="text-foreground">{t.name}</span> — {t.note}
                        </span>
                      </li>
                    ))}
                  </ul>
                  {debugResult.issues.length > 0 ? (
                    <div className="mt-3">
                      <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                        remaining issues
                      </p>
                      <ul className="mt-1 space-y-1 text-xs text-muted-foreground">
                        {debugResult.issues.map((b, i) => (
                          <li key={i}>
                            › [{b.severity}] {b.issue}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        )}
      </main>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit this round?</AlertDialogTitle>
            <AlertDialogDescription>
              {round === 1
                ? `You have answered ${answeredCount} of ${questions.length} questions. `
                : "Your current code will be sent for evaluation. "}
              Submissions are final and cannot be reopened.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep working</AlertDialogCancel>
            <AlertDialogAction onClick={() => void doSubmit(false)}>Submit now</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function Block({ label, body }: { label: string; body: string }) {
  return (
    <div className="mt-4">
      <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">{label}</p>
      <pre className="mt-1 overflow-x-auto rounded-md border border-border/60 bg-surface-2/60 p-3 font-mono text-xs">
        {body}
      </pre>
    </div>
  );
}

function Notice({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: { label: string; to: string };
}) {
  const navigate = useNavigate();
  return (
    <div className="hero-bg grid min-h-screen place-items-center px-4">
      <div className="glass max-w-md rounded-lg p-8 text-center">
        <h1 className="text-xl font-semibold">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{body}</p>
        {action ? (
          <Button className="mt-5" onClick={() => navigate({ to: action.to })}>
            {action.label}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
