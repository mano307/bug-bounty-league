import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Crown, Medal, Trophy } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { getLeaderboard } from "@/lib/exam.functions";
import { formatDuration } from "@/lib/exam-shared";
import { useAuth } from "@/lib/auth";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/leaderboard")({
  head: () => ({
    meta: [
      { title: "Live Leaderboard — DebugX" },
      {
        name: "description",
        content:
          "Live DebugX standings ranked by score, then fastest completion time and fewest proctoring warnings.",
      },
      { property: "og:title", content: "Live Leaderboard — DebugX" },
      { property: "og:description", content: "Live DebugX standings across all three rounds." },
    ],
  }),
  component: LeaderboardPage,
});

function LeaderboardPage() {
  const { user } = useAuth();
  const [round, setRound] = useState(0);
  const fetchBoard = useServerFn(getLeaderboard);

  const { data, isLoading } = useQuery({
    queryKey: ["leaderboard", round, user?.id],
    queryFn: () => fetchBoard({ data: { round } }),
    enabled: Boolean(user),
    refetchInterval: 10000,
  });

  return (
    <div className="hero-bg min-h-screen">
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl px-4 py-10">
        <header className="mb-6">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-primary">
            ~/debugx/standings
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">Live leaderboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Ranked by score, then fastest time, then fewest warnings.
          </p>
        </header>

        <Tabs value={String(round)} onValueChange={(v) => setRound(Number(v))} className="mb-6">
          <TabsList>
            <TabsTrigger value="0">Overall</TabsTrigger>
            <TabsTrigger value="1">Round 1</TabsTrigger>
            <TabsTrigger value="2">Round 2</TabsTrigger>
            <TabsTrigger value="3">Round 3</TabsTrigger>
          </TabsList>
        </Tabs>

        {!user ? (
          <p className="glass rounded-lg p-6 text-sm text-muted-foreground">
            Sign in to view the standings.
          </p>
        ) : isLoading ? (
          <Skeleton className="h-72 rounded-lg" />
        ) : !data?.visible ? (
          <p className="glass rounded-lg p-6 text-sm text-muted-foreground">
            The leaderboard is hidden by the organisers right now. Check back after the round closes.
          </p>
        ) : data.rows.length === 0 ? (
          <p className="glass rounded-lg p-6 text-sm text-muted-foreground">
            No submissions yet — the board fills up as participants submit.
          </p>
        ) : (
          <div className="glass overflow-hidden rounded-lg">
            <table className="w-full text-sm">
              <thead className="border-b border-border/60 bg-surface-2/50 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left">#</th>
                  <th className="px-4 py-3 text-left">Participant</th>
                  <th className="hidden px-4 py-3 text-left sm:table-cell">College</th>
                  <th className="px-4 py-3 text-right">Score</th>
                  <th className="hidden px-4 py-3 text-right md:table-cell">Time</th>
                  <th className="hidden px-4 py-3 text-right md:table-cell">Warnings</th>
                </tr>
              </thead>
              <tbody>
                {data.rows.map((row, i) => (
                  <tr
                    key={row.user_id}
                    className={`border-b border-border/40 last:border-0 ${
                      row.user_id === user.id ? "bg-primary/5" : ""
                    }`}
                  >
                    <td className="px-4 py-3 font-mono">
                      <span className="inline-flex items-center gap-1.5">
                        {i === 0 ? (
                          <Crown className="size-4 text-gold" />
                        ) : i === 1 ? (
                          <Medal className="size-4 text-silver" />
                        ) : i === 2 ? (
                          <Trophy className="size-4 text-bronze" />
                        ) : null}
                        {i + 1}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{row.full_name}</p>
                      <p className="font-mono text-xs text-muted-foreground">
                        {row.register_number}
                        {row.status === "eliminated" ? " · eliminated" : ""}
                      </p>
                    </td>
                    <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">
                      {row.college ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-primary">
                      {Math.round(row.score * 100) / 100}
                      <span className="text-muted-foreground">/{row.max_score}</span>
                    </td>
                    <td className="hidden px-4 py-3 text-right font-mono text-muted-foreground md:table-cell">
                      {formatDuration(row.duration_seconds)}
                    </td>
                    <td className="hidden px-4 py-3 text-right font-mono text-muted-foreground md:table-cell">
                      {row.warnings}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
