import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Bug,
  CheckCircle2,
  Lock,
  Megaphone,
  ShieldCheck,
  Terminal,
  Timer,
  Trophy,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { useAuth } from "@/lib/auth";
import { getMyProgress } from "@/lib/exam.functions";
import { ROUND_NAMES, formatDuration } from "@/lib/exam-shared";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Participant Dashboard — DebugX" },
      {
        name: "description",
        content:
          "Track your DebugX rounds, warnings and scores. Enter unlocked rounds and follow live announcements from the control room.",
      },
      { property: "og:title", content: "Participant Dashboard — DebugX" },
      {
        property: "og:description",
        content: "Track your DebugX rounds, warnings and scores in real time.",
      },
    ],
  }),
  component: Dashboard,
});

const ROUND_ICONS = [Terminal, Bug, ShieldCheck];

const STATE_STYLES: Record<string, string> = {
  locked: "border-border/60 text-muted-foreground",
  unlocked: "border-primary/50 text-primary",
  in_progress: "border-warning/50 text-warning",
  submitted: "border-accent/50 text-accent",
  qualified: "border-success/50 text-success",
  eliminated: "border-destructive/50 text-destructive",
};

function Dashboard() {
  const { user, profile, loading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const fetchProgress = useServerFn(getMyProgress);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth", replace: true });
  }, [loading, user, navigate]);

  const { data, isLoading } = useQuery({
    queryKey: ["progress", user?.id],
    queryFn: () => fetchProgress(),
    enabled: Boolean(user),
    refetchInterval: 15000,
  });

  const settings = data?.settings;
  const minutes = [
    settings?.round1_minutes ?? 20,
    settings?.round2_minutes ?? 25,
    settings?.round3_minutes ?? 30,
  ];
  const statuses = [
    settings?.round1_status ?? "pending",
    settings?.round2_status ?? "pending",
    settings?.round3_status ?? "pending",
  ];

  const totalScore = (data?.attempts ?? []).reduce((s, a) => s + Number(a.score ?? 0), 0);
  const totalWarnings = (data?.attempts ?? []).reduce((s, a) => s + Number(a.warnings_count ?? 0), 0);

  return (
    <div className="hero-bg min-h-screen">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl px-4 py-10">
        <header className="mb-8">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-primary">
            ~/debugx/participant
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
            Welcome{profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {profile?.register_number ? `${profile.register_number} · ` : ""}
            {profile?.college ?? "Registered participant"}
          </p>
        </header>

        {isAdmin ? (
          <div className="glass mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg p-4">
            <p className="text-sm text-muted-foreground">
              You have administrator access to this event.
            </p>
            <Button asChild size="sm">
              <Link to="/admin">Open control room</Link>
            </Button>
          </div>
        ) : null}

        {(data?.announcements?.length ?? 0) > 0 ? (
          <div className="glass mb-6 rounded-lg border-l-2 border-l-warning p-4">
            <div className="mb-2 flex items-center gap-2 text-warning">
              <Megaphone className="size-4" />
              <span className="font-mono text-xs uppercase tracking-widest">Announcements</span>
            </div>
            <ul className="space-y-1 text-sm text-foreground/90">
              {data?.announcements.map((a) => (
                <li key={a.id}>› {a.message}</li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <StatCard icon={Trophy} label="Total score" value={String(Math.round(totalScore * 100) / 100)} />
          <StatCard
            icon={AlertTriangle}
            label="Warnings issued"
            value={`${totalWarnings} / ${settings?.max_warnings ?? 3}`}
          />
          <StatCard
            icon={Timer}
            label="Time on task"
            value={formatDuration(
              (data?.attempts ?? []).reduce((s, a) => s + Number(a.duration_seconds ?? 0), 0),
            )}
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {isLoading
            ? [1, 2, 3].map((i) => <Skeleton key={i} className="h-64 rounded-lg" />)
            : [1, 2, 3].map((round) => {
                const access = data?.access.find((a) => a.round === round);
                const attempt = data?.attempts.find((a) => a.round === round);
                const state = access?.state ?? "locked";
                const Icon = ROUND_ICONS[round - 1] ?? Terminal;
                const roundLive = statuses[round - 1] === "live";
                const canEnter = ["unlocked", "in_progress"].includes(state) && roundLive;

                return (
                  <article
                    key={round}
                    className="glass flex flex-col rounded-lg p-5 transition-colors hover:border-primary/40"
                  >
                    <div className="flex items-start justify-between">
                      <span className="grid size-10 place-items-center rounded-md bg-primary/10 text-primary">
                        <Icon className="size-5" />
                      </span>
                      <Badge variant="outline" className={STATE_STYLES[state] ?? ""}>
                        {state.replace("_", " ")}
                      </Badge>
                    </div>
                    <h2 className="mt-4 font-mono text-xs uppercase tracking-widest text-muted-foreground">
                      Round {round}
                    </h2>
                    <p className="text-lg font-semibold">{ROUND_NAMES[round]}</p>
                    <p className="mt-2 flex-1 text-sm text-muted-foreground">
                      {round === 1
                        ? "Rapid-fire multiple choice on languages, data structures and algorithms."
                        : round === 2
                          ? "Broken programs. Find every defect and repair the code."
                          : "Build and debug a full solution under judge review."}
                    </p>

                    <dl className="mt-4 grid grid-cols-2 gap-2 border-t border-border/60 pt-4 text-xs">
                      <div>
                        <dt className="text-muted-foreground">Duration</dt>
                        <dd className="font-mono text-foreground">{minutes[round - 1]} min</dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">Score</dt>
                        <dd className="font-mono text-foreground">
                          {attempt ? `${attempt.score}/${attempt.max_score}` : "—"}
                        </dd>
                      </div>
                    </dl>

                    <div className="mt-4">
                      {attempt && attempt.status !== "in_progress" ? (
                        <Button asChild variant="outline" className="w-full">
                          <Link to="/results">
                            <CheckCircle2 className="size-4" /> View submission
                          </Link>
                        </Button>
                      ) : canEnter ? (
                        <Button asChild className="w-full">
                          <Link to="/rounds/$roundId" params={{ roundId: String(round) }}>
                            Enter round <ArrowRight className="size-4" />
                          </Link>
                        </Button>
                      ) : (
                        <Button disabled variant="outline" className="w-full">
                          <Lock className="size-4" />
                          {state === "eliminated"
                            ? "Eliminated"
                            : roundLive
                              ? "Awaiting admin unlock"
                              : "Round not live"}
                        </Button>
                      )}
                    </div>
                  </article>
                );
              })}
        </div>
      </main>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Trophy;
  label: string;
  value: string;
}) {
  return (
    <div className="glass rounded-lg p-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="size-4" />
        <span className="font-mono text-[11px] uppercase tracking-widest">{label}</span>
      </div>
      <p className="mt-2 font-mono text-2xl font-semibold text-foreground">{value}</p>
    </div>
  );
}
