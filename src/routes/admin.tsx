import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Activity,
  AlertTriangle,
  Bot,
  Download,
  Eye,
  Loader2,
  Lock,
  Megaphone,
  Radio,
  Settings2,
  ShieldCheck,
  Trash2,
  Users,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import {
  adminBroadcast,
  adminDeleteParticipants,
  adminGetAttemptDetail,
  adminOverview,
  adminOverrideScore,
  adminReevaluate,
  adminSetRoundState,
  adminUpdateSettings,
} from "@/lib/exam.functions";
import { formatDuration } from "@/lib/exam-shared";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Control Room — DebugX Admin" },
      {
        name: "description",
        content:
          "DebugX organiser control room: live proctoring feed, round unlocks, scoring overrides and event configuration.",
      },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Control Room — DebugX Admin" },
      { property: "og:description", content: "Live monitoring and event control for DebugX." },
    ],
  }),
  component: AdminPage,
});

export function AdminPage() {
  const { user, isAdmin, loading, refresh } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const fetchOverview = useServerFn(adminOverview);
  const setRoundState = useServerFn(adminSetRoundState);
  const updateSettings = useServerFn(adminUpdateSettings);
  const broadcast = useServerFn(adminBroadcast);
  const overrideScore = useServerFn(adminOverrideScore);
  const reevaluate = useServerFn(adminReevaluate);
  const deleteParticipants = useServerFn(adminDeleteParticipants);

  const [selected, setSelected] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [detailId, setDetailId] = useState<string | null>(null);
  const [gradeRound, setGradeRound] = useState<0 | 1 | 2 | 3>(0);

  const fetchDetail = useServerFn(adminGetAttemptDetail);
  const detail = useQuery({
    queryKey: ["attempt-detail", detailId],
    queryFn: () => fetchDetail({ data: { attempt_id: detailId! } }),
    enabled: Boolean(detailId),
  });

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth", replace: true });
  }, [loading, user, navigate]);

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-overview"],
    queryFn: () => fetchOverview(),
    enabled: Boolean(user) && isAdmin,
    refetchInterval: 20000,
  });

  // Realtime control room feed
  useEffect(() => {
    if (!isAdmin) return;
    const channel = supabase
      .channel("control-room")
      .on("postgres_changes", { event: "*", schema: "public", table: "warnings" }, () =>
        qc.invalidateQueries({ queryKey: ["admin-overview"] }),
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "activity_log" }, () =>
        qc.invalidateQueries({ queryKey: ["admin-overview"] }),
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "attempts" }, () =>
        qc.invalidateQueries({ queryKey: ["admin-overview"] }),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [isAdmin, qc]);

  const mutate = useMutation({
    mutationFn: async (fn: () => Promise<unknown>) => fn(),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin-overview"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Action failed"),
  });

  if (loading) {
    return (
      <div className="hero-bg grid min-h-screen place-items-center">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="hero-bg min-h-screen">
        <SiteHeader />
        <main className="mx-auto grid max-w-md place-items-center px-4 py-24">
          <div className="glass rounded-lg p-8 text-center">
            <ShieldCheck className="mx-auto size-8 text-primary" />
            <h1 className="mt-3 text-xl font-semibold">Organiser access required</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              This control room is restricted to the DebugX organiser account. Sign in with the
              organiser email to continue.
            </p>
            <Button className="mt-5" variant="outline" onClick={() => void refresh()}>
              Recheck access
            </Button>
          </div>
        </main>

      </div>
    );
  }

  const profiles = data?.profiles ?? [];
  const attempts = data?.attempts ?? [];
  const access = data?.access ?? [];
  const settings = data?.settings;

  const liveNow = access.filter((a) => a.state === "in_progress").length;
  const flagged = (data?.warnings ?? []).length;

  function toggle(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function downloadParticipantsCsv() {
    const headers = ["Name", "Register Number", "Email", "Department", "Year", "Section"];
    const rows = profiles.map((p) => [
      p.full_name,
      p.register_number,
      p.email,
      p.department,
      p.year,
      p.section,
    ]);
    const csv = [headers, ...rows]
      .map((row) =>
        row
          .map((cell) => {
            const value = String(cell ?? "").replace(/"/g, '""');
            return value.includes(",") || value.includes('"') || value.includes("\n")
              ? `"${value}"`
              : value;
          })
          .join(","),
      )
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${settings?.event_name ?? "DebugX"}_participants.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="hero-bg min-h-screen">
      <SiteHeader />
      <main className="mx-auto w-full max-w-7xl px-4 py-10">
        <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-primary">
              ~/debugx/control-room
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
              {settings?.event_name ?? "DebugX"} control room
            </h1>
          </div>
          <Badge variant="outline" className="border-success/50 text-success">
            <Radio className="size-3.5" /> realtime
          </Badge>
        </header>

        {error ? (
          <p className="glass mb-6 rounded-lg p-4 text-sm text-destructive">
            {error instanceof Error ? error.message : "Failed to load"}
          </p>
        ) : null}

        <div className="mb-6 grid gap-4 sm:grid-cols-4">
          <Kpi icon={Users} label="Registered" value={String(profiles.length)} />
          <Kpi icon={Activity} label="In progress" value={String(liveNow)} />
          <Kpi icon={AlertTriangle} label="Warnings logged" value={String(flagged)} />
          <Kpi
            icon={Bot}
            label="Submissions"
            value={String(attempts.filter((a) => a.status !== "in_progress").length)}
          />
        </div>

        <Tabs defaultValue="participants">
          <TabsList className="mb-4 flex-wrap">
            <TabsTrigger value="participants">Participants</TabsTrigger>
            <TabsTrigger value="monitor">Live monitor</TabsTrigger>
            <TabsTrigger value="grading">Grading</TabsTrigger>
            <TabsTrigger value="settings">Event settings</TabsTrigger>
          </TabsList>

          <TabsContent value="participants">
            <div className="glass rounded-lg p-4">
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs text-muted-foreground">
                  {selected.length} selected
                </span>
                {[1, 2, 3].map((r) => (
                  <Button
                    key={`unlock-${r}`}
                    size="sm"
                    variant="outline"
                    disabled={selected.length === 0}
                    onClick={() =>
                      mutate.mutate(() =>
                        setRoundState({ data: { user_ids: selected, round: r, state: "unlocked" } }),
                      )
                    }
                  >
                    Unlock R{r}
                  </Button>
                ))}
                {[1, 2, 3].map((r) => (
                  <Button
                    key={`lock-${r}`}
                    size="sm"
                    variant="secondary"
                    disabled={selected.length === 0}
                    onClick={() =>
                      mutate.mutate(() =>
                        setRoundState({ data: { user_ids: selected, round: r, state: "locked" } }),
                      )
                    }
                  >
                    <Lock className="size-3.5" /> Lock R{r}
                  </Button>
                ))}
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={selected.length === 0}
                  onClick={() =>
                    mutate.mutate(async () => {
                      for (const r of [1, 2, 3]) {
                        await setRoundState({
                          data: { user_ids: selected, round: r, state: "locked" },
                        });
                      }
                    })
                  }
                >
                  <Lock className="size-3.5" /> Lock all rounds
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={profiles.length === 0}
                  onClick={() => {
                    if (!window.confirm("Lock all three rounds for every participant?")) return;
                    mutate.mutate(async () => {
                      const ids = profiles.map((p) => p.id);
                      for (const r of [1, 2, 3]) {
                        await setRoundState({ data: { user_ids: ids, round: r, state: "locked" } });
                      }
                    });
                  }}
                >
                  <Lock className="size-3.5" /> Lock everyone
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={selected.length === 0}
                  onClick={() =>
                    mutate.mutate(() =>
                      setRoundState({
                        data: { user_ids: selected, round: 3, state: "eliminated" },
                      }),
                    )
                  }
                >

                  Eliminate
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={profiles.length === 0}
                  onClick={downloadParticipantsCsv}
                >
                  <Download className="size-3.5" /> Download CSV
                </Button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-border/60 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2" />
                      <th className="px-3 py-2 text-left">Participant</th>
                      <th className="px-3 py-2 text-left">Rounds</th>
                      <th className="px-3 py-2 text-right">Score</th>
                      <th className="px-3 py-2 text-right">Warnings</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr>
                        <td colSpan={5} className="px-3 py-6 text-center text-muted-foreground">
                          Loading…
                        </td>
                      </tr>
                    ) : (
                      profiles.map((p) => {
                        const mine = attempts.filter((a) => a.user_id === p.id);
                        const states = access.filter((a) => a.user_id === p.id);
                        return (
                          <tr key={p.id} className="border-b border-border/40 last:border-0">
                            <td className="px-3 py-2">
                              <Checkbox
                                checked={selected.includes(p.id)}
                                onCheckedChange={() => toggle(p.id)}
                              />
                            </td>
                            <td className="px-3 py-2">
                              <p className="font-medium">{p.full_name}</p>
                              <p className="font-mono text-xs text-muted-foreground">
                                {p.register_number} · {p.department}
                              </p>
                            </td>
                            <td className="px-3 py-2">
                              <div className="flex gap-1">
                                {[1, 2, 3].map((r) => {
                                  const s = states.find((x) => x.round === r)?.state ?? "locked";
                                  return (
                                    <span
                                      key={r}
                                      title={`Round ${r}: ${s}`}
                                      className={`grid size-6 place-items-center rounded border font-mono text-[10px] ${
                                        s === "eliminated"
                                          ? "border-destructive/60 text-destructive"
                                          : s === "submitted"
                                            ? "border-accent/60 text-accent"
                                            : s === "in_progress"
                                              ? "border-warning/60 text-warning"
                                              : s === "unlocked"
                                                ? "border-primary/60 text-primary"
                                                : "border-border/60 text-muted-foreground"
                                      }`}
                                    >
                                      {r}
                                    </span>
                                  );
                                })}
                              </div>
                            </td>
                            <td className="px-3 py-2 text-right font-mono text-primary">
                              {Math.round(
                                mine.reduce((s, a) => s + Number(a.score ?? 0), 0) * 100,
                              ) / 100}
                            </td>
                            <td className="px-3 py-2 text-right font-mono text-muted-foreground">
                              {mine.reduce((s, a) => s + Number(a.warnings_count ?? 0), 0)}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="monitor">
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="glass rounded-lg p-4">
                <p className="mb-3 flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                  <Activity className="size-3.5" /> Activity feed
                </p>
                <ul className="max-h-96 space-y-2 overflow-y-auto text-xs">
                  {(data?.activity ?? []).map((a) => (
                    <li key={a.id} className="border-l-2 border-l-border/60 pl-3">
                      <span className="font-mono text-muted-foreground">
                        {new Date(a.created_at).toLocaleTimeString()}
                      </span>{" "}
                      <span className="text-foreground">{a.actor_name}</span> — {a.detail}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="glass rounded-lg p-4">
                <p className="mb-3 flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-warning">
                  <AlertTriangle className="size-3.5" /> Proctoring warnings
                </p>
                <ul className="max-h-96 space-y-2 overflow-y-auto text-xs">
                  {(data?.warnings ?? []).map((w) => {
                    const who = profiles.find((p) => p.id === w.user_id);
                    return (
                      <li key={w.id} className="border-l-2 border-l-warning/60 pl-3">
                        <span className="font-mono text-muted-foreground">
                          {new Date(w.created_at).toLocaleTimeString()}
                        </span>{" "}
                        <span className="text-foreground">{who?.full_name ?? "Unknown"}</span> · R
                        {w.round} · {w.reason} (#{w.warning_number})
                      </li>
                    );
                  })}
                </ul>
              </div>

              <div className="glass rounded-lg p-4 lg:col-span-2">
                <p className="mb-3 flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                  <Megaphone className="size-3.5" /> Broadcast announcement
                </p>
                <div className="flex gap-2">
                  <Input
                    value={message}
                    maxLength={400}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Round 2 begins in 5 minutes…"
                  />
                  <Button
                    disabled={!message.trim()}
                    onClick={() =>
                      mutate.mutate(async () => {
                        await broadcast({ data: { message: message.trim() } });
                        setMessage("");
                        toast.success("Announcement sent");
                      })
                    }
                  >
                    Send
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="grading">
            <div className="mb-3 flex flex-wrap gap-2">
              {([0, 1, 2, 3] as const).map((r) => {
                const n = attempts.filter(
                  (a) => a.status !== "in_progress" && (r === 0 || a.round === r),
                ).length;
                return (
                  <Button
                    key={r}
                    size="sm"
                    variant={gradeRound === r ? "default" : "outline"}
                    onClick={() => setGradeRound(r)}
                  >
                    {r === 0 ? "All rounds" : `Round ${r}`} ({n})
                  </Button>
                );
              })}
            </div>
            <div className="glass overflow-x-auto rounded-lg p-4">
              <table className="w-full text-sm">
                <thead className="border-b border-border/60 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 text-left">Participant</th>
                    <th className="px-3 py-2 text-left">Round</th>
                    <th className="px-3 py-2 text-left">Status</th>
                    <th className="px-3 py-2 text-left">Warnings</th>
                    <th className="px-3 py-2 text-right">Score</th>

                    <th className="px-3 py-2 text-right">Time</th>
                    <th className="px-3 py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {attempts
                    .filter(
                      (a) =>
                        a.status !== "in_progress" &&
                        (gradeRound === 0 || a.round === gradeRound),
                    )
                    .map((a) => {
                      const who = profiles.find((p) => p.id === a.user_id);
                      const autoWarn =
                        a.status === "auto_submitted" &&
                        (a.warnings_count ?? 0) >= (settings?.max_warnings ?? 3);
                      const myWarnings = (data?.warnings ?? []).filter(
                        (w) => w.user_id === a.user_id && w.round === a.round,
                      );
                      const warnCount = a.warnings_count ?? myWarnings.length;
                      return (
                        <tr key={a.id} className="border-b border-border/40 last:border-0">
                          <td className="px-3 py-2">{who?.full_name ?? "—"}</td>
                          <td className="px-3 py-2 font-mono">R{a.round}</td>
                          <td className="px-3 py-2">
                            {a.status === "auto_submitted" ? (
                              <Badge variant="outline" className="border-warning/60 text-warning">
                                <AlertTriangle className="size-3" />
                                {autoWarn
                                  ? `Auto-submitted · ${a.warnings_count} warnings`
                                  : "Auto-submitted · time up"}
                              </Badge>
                            ) : (
                              <Badge variant="outline">Submitted</Badge>
                            )}
                          </td>
                          <td className="px-3 py-2">
                            <Badge
                              variant="outline"
                              className={
                                warnCount > 0 ? "border-warning/60 text-warning" : undefined
                              }
                            >
                              {warnCount} warning{warnCount === 1 ? "" : "s"}
                            </Badge>
                            {myWarnings.length ? (
                              <p className="mt-1 max-w-[220px] text-[11px] leading-tight text-muted-foreground">
                                {myWarnings
                                  .slice()
                                  .sort((x, y) => x.warning_number - y.warning_number)
                                  .map((w) => `#${w.warning_number} ${w.reason}`)
                                  .join(" · ")}
                              </p>
                            ) : null}
                          </td>
                          <td className="px-3 py-2 text-right font-mono text-primary">



                            {a.score}/{a.max_score}
                          </td>
                          <td className="px-3 py-2 text-right font-mono text-muted-foreground">
                            {formatDuration(a.duration_seconds)}
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setDetailId(a.id)}
                              >
                                <Eye className="size-3.5" /> View answers
                              </Button>
                              {a.round > 1 ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    mutate.mutate(async () => {
                                      await reevaluate({ data: { attempt_id: a.id } });
                                      toast.success("Re-evaluated");
                                    })
                                  }
                                >
                                  <Bot className="size-3.5" /> Re-evaluate
                                </Button>
                              ) : null}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  const raw = window.prompt(
                                    "Manual score override",
                                    String(a.score),
                                  );
                                  if (raw === null) return;
                                  const value = Number(raw);
                                  if (Number.isNaN(value) || value < 0) {
                                    toast.error("Enter a valid score");
                                    return;
                                  }
                                  const remarks = window.prompt("Judge remarks", a.judge_remarks ?? "") ?? "";
                                  mutate.mutate(async () => {
                                    await overrideScore({
                                      data: {
                                        attempt_id: a.id,
                                        manual_score: value,
                                        judge_remarks: remarks,
                                      },
                                    });
                                    toast.success("Score updated");
                                  });
                                }}
                              >
                                Override
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="settings">
            {settings ? (
              <form
                className="glass grid gap-5 rounded-lg p-6 md:grid-cols-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  const fd = new FormData(e.currentTarget);
                  mutate.mutate(async () => {
                    await updateSettings({
                      data: {
                        event_name: String(fd.get("event_name") ?? ""),
                        round1_minutes: Number(fd.get("round1_minutes")),
                        round2_minutes: Number(fd.get("round2_minutes")),
                        round3_minutes: Number(fd.get("round3_minutes")),
                        max_warnings: Number(fd.get("max_warnings")),
                        warning_penalty: Number(fd.get("warning_penalty")),
                        negative_marking: Number(fd.get("negative_marking")),
                      },
                    });
                    toast.success("Settings saved");
                  });
                }}
              >
                <p className="col-span-full flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                  <Settings2 className="size-3.5" /> Event configuration
                </p>
                <Field name="event_name" label="Event name" defaultValue={settings.event_name} />
                <Field
                  name="max_warnings"
                  label="Warning limit"
                  type="number"
                  defaultValue={String(settings.max_warnings)}
                />
                <Field
                  name="round1_minutes"
                  label="Round 1 minutes"
                  type="number"
                  defaultValue={String(settings.round1_minutes)}
                />
                <Field
                  name="round2_minutes"
                  label="Round 2 minutes"
                  type="number"
                  defaultValue={String(settings.round2_minutes)}
                />
                <Field
                  name="round3_minutes"
                  label="Round 3 minutes"
                  type="number"
                  defaultValue={String(settings.round3_minutes)}
                />
                <Field
                  name="warning_penalty"
                  label="Penalty per warning"
                  type="number"
                  defaultValue={String(settings.warning_penalty)}
                />
                <Field
                  name="negative_marking"
                  label="Negative marking (MCQ)"
                  type="number"
                  defaultValue={String(settings.negative_marking)}
                />
                <div className="col-span-full">
                  <Button type="submit">Save configuration</Button>
                </div>

                <div className="col-span-full grid gap-3 border-t border-border/60 pt-5 sm:grid-cols-2">
                  {(
                    [
                      ["round1_status", "Round 1 live"],
                      ["round2_status", "Round 2 live"],
                      ["round3_status", "Round 3 live"],
                    ] as const
                  ).map(([key, label]) => (
                    <Toggle
                      key={key}
                      label={label}
                      checked={settings[key] === "live"}
                      onChange={(v) =>
                        mutate.mutate(() =>
                          updateSettings({ data: { [key]: v ? "live" : "closed" } }),
                        )
                      }
                    />
                  ))}
                  <Toggle
                    label="Leaderboard public"
                    checked={settings.leaderboard_public}
                    onChange={(v) => mutate.mutate(() => updateSettings({ data: { leaderboard_public: v } }))}
                  />
                  <Toggle
                    label="Results published"
                    checked={settings.results_published}
                    onChange={(v) => mutate.mutate(() => updateSettings({ data: { results_published: v } }))}
                  />
                  <Toggle
                    label="Auto-submit on timeout"
                    checked={settings.auto_submit}
                    onChange={(v) => mutate.mutate(() => updateSettings({ data: { auto_submit: v } }))}
                  />
                </div>
              </form>
            ) : null}
          </TabsContent>
        </Tabs>
      </main>

      <Dialog open={Boolean(detailId)} onOpenChange={(open) => !open && setDetailId(null)}>
        <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Participant answer sheet</DialogTitle>
            <DialogDescription>
              {detail.data
                ? `${detail.data.profile?.full_name ?? "Participant"} · ${detail.data.profile?.register_number ?? "—"} · Round ${detail.data.attempt.round} · ${detail.data.attempt.score}/${detail.data.attempt.max_score}`
                : "Loading submission…"}
            </DialogDescription>
          </DialogHeader>
          {detail.isLoading ? (
            <Loader2 className="mx-auto size-5 animate-spin text-primary" />
          ) : detail.data ? (
            <div className="space-y-4">
              {detail.data.answers.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  This participant did not record any answers.
                </p>
              ) : null}
              {detail.data.answers.map((ans, i) => (
                <div key={ans.question_id} className="rounded-md border border-border/60 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-medium">
                      {i + 1}. {ans.title}
                    </p>
                    {ans.is_correct === null ? null : (
                      <Badge
                        variant="outline"
                        className={
                          ans.is_correct
                            ? "border-success/60 text-success"
                            : "border-destructive/60 text-destructive"
                        }
                      >
                        {ans.is_correct ? "Correct" : "Wrong"}
                      </Badge>
                    )}
                  </div>
                  {ans.options.length > 0 ? (
                    <ul className="mt-3 space-y-1">
                      {ans.options.map((opt, oi) => {
                        const chosen = ans.selected_index === oi;
                        const key = ans.correct_index === oi;
                        return (
                          <li
                            key={oi}
                            className={`rounded border px-2 py-1 font-mono text-xs ${
                              key
                                ? "border-success/60 text-success"
                                : chosen
                                  ? "border-destructive/60 text-destructive"
                                  : "border-border/50 text-muted-foreground"
                            }`}
                          >
                            {String.fromCharCode(65 + oi)}. {opt}
                            {chosen ? " · chosen" : ""}
                            {key ? " · answer key" : ""}
                          </li>
                        );
                      })}
                    </ul>
                  ) : null}
                  {ans.code ? (
                    <pre className="mt-3 max-h-72 overflow-auto rounded border border-border/60 bg-surface-2/60 p-3 font-mono text-xs">
                      {ans.code}
                    </pre>
                  ) : ans.options.length === 0 ? (
                    <p className="mt-2 text-xs text-muted-foreground">No code submitted.</p>
                  ) : null}
                </div>
              ))}
              {detail.data.attempt.code ? (
                <div className="rounded-md border border-border/60 p-4">
                  <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                    final submitted code · {detail.data.attempt.language ?? "—"}
                  </p>
                  <pre className="mt-2 max-h-72 overflow-auto rounded border border-border/60 bg-surface-2/60 p-3 font-mono text-xs">
                    {detail.data.attempt.code}
                  </pre>
                </div>
              ) : null}
            </div>
          ) : (
            <p className="text-sm text-destructive">Could not load this submission.</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Kpi({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Users;
  label: string;
  value: string;
}) {
  return (
    <div className="glass rounded-lg p-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="size-4" />
        <span className="font-mono text-[11px] uppercase tracking-widest">{label}</span>
      </div>
      <p className="mt-2 font-mono text-2xl font-semibold">{value}</p>
    </div>
  );
}

function Field({
  name,
  label,
  defaultValue,
  type = "text",
}: {
  name: string;
  label: string;
  defaultValue: string;
  type?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} type={type} defaultValue={defaultValue} step="any" />
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-md border border-border/60 px-3 py-2">
      <span className="text-sm">{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
