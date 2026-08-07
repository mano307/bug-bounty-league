import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/rules")({
  head: () => ({
    meta: [
      { title: "Rules & Instructions — DebugX" },
      {
        name: "description",
        content:
          "Competition rules for DebugX: round format, timing, proctoring policy, warning limits and scoring.",
      },
      { property: "og:title", content: "Rules & Instructions — DebugX" },
      {
        property: "og:description",
        content: "Round format, timing, proctoring policy, warning limits and scoring.",
      },
    ],
  }),
  component: RulesPage,
});

const sections = [
  {
    title: "Format",
    items: [
      "Three elimination rounds: MCQ, Error Spotting, Live Debugging.",
      "Round 2 and Round 3 remain locked until organisers publish results and promote you.",
      "Each round can be attempted exactly once.",
    ],
  },
  {
    title: "Timing",
    items: [
      "Every round is timed from the moment you press Start.",
      "The countdown is server-anchored — reloading does not reset it.",
      "When the timer reaches zero your work is submitted automatically.",
    ],
  },
  {
    title: "Proctoring",
    items: [
      "Switching browser tabs, minimising the window or losing focus is recorded.",
      "Copy, paste, right-click and developer-tool shortcuts are blocked and logged.",
      "Each violation raises a warning. Exceeding the configured limit auto-submits your attempt.",
    ],
  },
  {
    title: "Scoring",
    items: [
      "MCQ answers are auto-scored, with optional negative marking.",
      "Rounds 2 and 3 are judged on correctness, defects fixed, code quality and performance.",
      "Ranking priority: higher score, then fewer warnings, then faster completion time.",
    ],
  },
];

function RulesPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-14">
        <p className="font-mono text-xs uppercase tracking-[0.28em] text-primary">Handbook</p>
        <h1 className="mt-3 font-display text-4xl font-bold">Rules &amp; Instructions</h1>
        <p className="mt-3 text-muted-foreground">
          Read carefully. Accepting these rules is required before Round 1 begins.
        </p>

        <div className="mt-10 space-y-6">
          {sections.map((s) => (
            <section key={s.title} className="glass rounded-xl p-6">
              <h2 className="font-display text-lg font-semibold text-primary">{s.title}</h2>
              <ul className="mt-3 space-y-2">
                {s.items.map((i) => (
                  <li key={i} className="flex gap-3 text-sm leading-relaxed text-muted-foreground">
                    <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary/70" />
                    {i}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <div className="mt-10 flex gap-3">
          <Button asChild>
            <Link to="/dashboard">Go to my dashboard</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/">Back home</Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
