import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Bug, Gauge, Lock, Radio, ShieldAlert, Sparkles } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "DebugX — College Debugging Competition Platform" },
      {
        name: "description",
        content:
          "Run a three-round college debugging contest: MCQ, error spotting and live debugging, with live proctoring, real-time leaderboards and AI-assisted judging.",
      },
      { property: "og:title", content: "DebugX — Find the bug. Beat the clock." },
      {
        property: "og:description",
        content: "Three elimination rounds, live monitoring and AI-assisted code evaluation.",
      },
    ],
  }),
  component: Landing,
});

const rounds = [
  {
    n: "01",
    name: "Multiple Choice",
    icon: Gauge,
    body: "Randomised questions and options, one per page, server-timed with auto-submit.",
  },
  {
    n: "02",
    name: "Error Spotting",
    icon: Bug,
    body: "Broken source on the left, a full VS Code editor on the right. Fix it before the clock runs out.",
  },
  {
    n: "03",
    name: "Live Debugging",
    icon: Sparkles,
    body: "Write the program from scratch against hidden test cases and an AI judge.",
  },
];

const features = [
  { icon: ShieldAlert, title: "Anti-cheat proctoring", body: "Tab switches, focus loss, copy/paste, right click and devtools shortcuts are logged and escalated to auto-submit." },
  { icon: Radio, title: "Live control room", body: "Realtime participant status, activity feed, warnings table and submissions — no refresh needed." },
  { icon: Lock, title: "Gated progression", body: "Rounds 2 and 3 stay locked until an admin promotes a participant." },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <main>
        <section className="hero-bg relative overflow-hidden border-b border-border/60">
          <div className="grid-lines pointer-events-none absolute inset-0" aria-hidden="true" />
          <div className="relative mx-auto grid max-w-7xl gap-12 px-4 py-20 lg:grid-cols-[1.05fr_1fr] lg:py-28">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.22em] text-primary">
                <span className="live-dot size-1.5 rounded-full bg-primary" /> three elimination rounds
              </span>
              <h1 className="mt-6 font-display text-5xl font-bold leading-[1.05] tracking-tight sm:text-6xl">
                Find the bug.
                <br />
                <span className="text-gradient">Beat the clock.</span>
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
                DebugX is a proctored debugging arena for college competitions — built for 200 to
                1000 participants, with server-synced timers, live monitoring and AI-assisted
                judging.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild size="lg">
                  <Link to="/auth">
                    Enter the arena <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link to="/rules">Read the rules</Link>
                </Button>
              </div>
            </div>

            <div className="scan-line glass glow-ring rounded-xl p-1">
              <div className="flex items-center gap-2 px-3 py-2">
                <span className="size-2.5 rounded-full bg-destructive/70" />
                <span className="size-2.5 rounded-full bg-warning/70" />
                <span className="size-2.5 rounded-full bg-primary/70" />
                <span className="ml-2 font-mono text-xs text-muted-foreground">round2/fix.py</span>
              </div>
              <pre className="overflow-x-auto rounded-lg bg-background/70 p-5 font-mono text-[13px] leading-relaxed text-muted-foreground">
                <code>
                  {`def average(nums):
    total = 0
`}
                  <span className="text-destructive">{`    for i in range(1, len(nums)):   # off-by-one\n`}</span>
                  {`        total += nums[i]
`}
                  <span className="text-destructive">{`    return total / len(nums)        # ZeroDivisionError\n`}</span>
                  {`
`}
                  <span className="text-primary">{`# 2 defects detected · 00:14:32 remaining`}</span>
                </code>
              </pre>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-20">
          <h2 className="font-display text-3xl font-bold">The route to the final</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {rounds.map((r) => (
              <article key={r.n} className="glass rounded-xl p-6 transition-colors hover:border-primary/40">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-3xl font-bold text-primary/25">{r.n}</span>
                  <r.icon className="size-5 text-primary" />
                </div>
                <h3 className="mt-4 font-display text-lg font-semibold">{r.name}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{r.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="border-y border-border/60 bg-surface/40">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 py-16 md:grid-cols-3">
            {features.map((f) => (
              <div key={f.title}>
                <f.icon className="size-5 text-accent" />
                <h3 className="mt-3 font-display text-base font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-20 text-center">
          <h2 className="font-display text-3xl font-bold">Ready when your cohort is</h2>
          <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
            Register with your college details, accept the rules, and Round 1 unlocks.
          </p>
          <Button asChild size="lg" className="mt-8">
            <Link to="/auth">
              Register now <ArrowRight className="size-4" />
            </Link>
          </Button>
        </section>
      </main>

      <footer className="border-t border-border/60 py-8 text-center font-mono text-xs text-muted-foreground">
        DebugX · College Debugging Competition Platform
      </footer>
    </div>
  );
}
