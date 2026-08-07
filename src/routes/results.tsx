import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { Bot, CheckCircle2, Gauge, Loader2, XCircle } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { useAuth } from "@/lib/auth";
import { getMyProgress } from "@/lib/exam.functions";
import { ROUND_NAMES, formatDuration, type AIReport } from "@/lib/exam-shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute("/results")({
  head: () => ({
    meta: [
      { title: "My Results — DebugX" },
      {
        name: "description",
        content:
          "Round-by-round DebugX results with AI judge feedback, test-case outcomes and improvement recommendations.",
      },
      { property: "og:title", content: "My Results — DebugX" },
      { property: "og:description", content: "Round-by-round DebugX results and AI judge feedback." },
    ],
  }),
  component: ResultsPage,
});

function ResultsPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const fetchProgress = useServerFn(getMyProgress);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth", replace: true });
  }, [loading, user, navigate]);

  const { data, isLoading } = useQuery({
    queryKey: ["progress", user?.id],
    queryFn: () => fetchProgress(),
    enabled: Boolean(user),
  });

  const published = data?.settings?.results_published ?? false;
  const attempts = (data?.attempts ?? []).filter((a) => a.status !== "in_progress");

  return (
    <div className="hero-bg min-h-screen">
      <SiteHeader />
      <main className="mx-auto w-full max-w-4xl px-4 py-10">
        <header className="mb-8">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-primary">
            ~/debugx/results
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">Your submissions</h1>
        </header>

        {isLoading ? (
          <Loader2 className="size-6 animate-spin text-primary" />
        ) : attempts.length === 0 ? (
          <div className="glass rounded-lg p-6">
            <p className="text-sm text-muted-foreground">
              You haven't submitted any round yet.
            </p>
            <Button asChild className="mt-4">
              <Link to="/dashboard">Back to dashboard</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-5">
            {attempts.map((a) => {
              const report = a.ai_report as AIReport | null;
              const pct = a.max_score ? (Number(a.score) / Number(a.max_score)) * 100 : 0;
              return (
                <article key={a.id} className="glass rounded-lg p-6">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                        Round {a.round}
                      </p>
                      <h2 className="text-lg font-semibold">{ROUND_NAMES[a.round]}</h2>
                    </div>
                    <Badge variant="outline" className="border-accent/50 text-accent">
                      {a.status.replace("_", " ")}
                    </Badge>
                  </div>

                  {published ? (
                    <>
                      <div className="mt-4 flex items-baseline gap-2">
                        <span className="font-mono text-3xl font-bold text-primary">{a.score}</span>
                        <span className="text-sm text-muted-foreground">/ {a.max_score}</span>
                      </div>
                      <Progress value={pct} className="mt-3" />
                    </>
                  ) : (
                    <p className="mt-4 text-sm text-muted-foreground">
                      Scores are withheld until the organisers publish results.
                    </p>
                  )}

                  <dl className="mt-5 grid grid-cols-2 gap-3 border-t border-border/60 pt-4 text-xs sm:grid-cols-4">
                    <Stat label="Correct" value={String(a.correct_count)} />
                    <Stat label="Incorrect" value={String(a.wrong_count)} />
                    <Stat label="Warnings" value={String(a.warnings_count)} />
                    <Stat label="Time taken" value={formatDuration(a.duration_seconds)} />
                  </dl>

                  {published && report && "summary" in report ? (
                    <div className="mt-5 rounded-md border border-border/60 bg-surface-2/40 p-4">
                      <div className="flex items-center gap-2 text-accent">
                        <Bot className="size-4" />
                        <span className="font-mono text-[11px] uppercase tracking-widest">
                          AI judge report
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-foreground/90">{report.summary}</p>

                      <div className="mt-4 grid gap-2 sm:grid-cols-2">
                        <Metric label="Correctness" value={report.correctness_score} />
                        <Metric label="Code quality" value={report.quality_score} />
                        <Metric label="Performance" value={report.performance_score} />
                        <Metric label="Best practices" value={report.best_practices_score} />
                      </div>

                      {report.test_cases?.length ? (
                        <ul className="mt-4 space-y-1 text-xs">
                          {report.test_cases.map((t, i) => (
                            <li key={i} className="flex items-start gap-2">
                              {t.passed ? (
                                <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-success" />
                              ) : (
                                <XCircle className="mt-0.5 size-3.5 shrink-0 text-destructive" />
                              )}
                              <span className="font-mono text-muted-foreground">
                                {t.name} — {t.note}
                              </span>
                            </li>
                          ))}
                        </ul>
                      ) : null}

                      {report.recommendations?.length ? (
                        <div className="mt-4">
                          <p className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                            <Gauge className="size-3.5" /> Recommendations
                          </p>
                          <ul className="mt-1 space-y-1 text-xs text-foreground/85">
                            {report.recommendations.map((r, i) => (
                              <li key={i}>› {r}</li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                    </div>
                  ) : null}

                  {published && a.judge_remarks ? (
                    <p className="mt-4 border-l-2 border-l-warning pl-3 text-sm text-foreground/90">
                      <span className="font-mono text-xs uppercase tracking-widest text-warning">
                        Judge remark:{" "}
                      </span>
                      {a.judge_remarks}
                    </p>
                  ) : null}
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-0.5 font-mono text-sm text-foreground">{value}</dd>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono text-foreground">{Math.round(value)}</span>
      </div>
      <Progress value={value} className="mt-1 h-1.5" />
    </div>
  );
}
