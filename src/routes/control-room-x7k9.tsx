import { createFileRoute } from "@tanstack/react-router";
import { AdminPage } from "./admin";

export const Route = createFileRoute("/control-room-x7k9")({
  head: () => ({
    meta: [
      { title: "Private Control Room — DebugX" },
      {
        name: "description",
        content: "Private DebugX organiser console for round locks, monitoring and grading.",
      },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Private Control Room — DebugX" },
      { property: "og:description", content: "Restricted DebugX organiser console." },
    ],
  }),
  component: AdminPage,
});
