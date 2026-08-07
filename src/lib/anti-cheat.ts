import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export type ViolationReason =
  | "Tab switched"
  | "Window lost focus"
  | "Copy attempted"
  | "Paste attempted"
  | "Right click attempted"
  | "Developer tools shortcut"
  | "Page refresh attempted"
  | "Back navigation attempted"
  | "Full screen exited";

type Options = {
  userId: string | undefined;
  round: number;
  maxWarnings: number;
  active: boolean;
  onLimitExceeded: () => void;
  actorName?: string;
  registerNumber?: string;
};

/**
 * Browser-side proctoring. Detectable violations raise an escalating warning,
 * persist to the database (which streams to the admin control room in realtime)
 * and auto-submit once the admin-configured limit is passed.
 */
export function useAntiCheat({
  userId,
  round,
  maxWarnings,
  active,
  onLimitExceeded,
  actorName = "",
  registerNumber = "",
}: Options) {
  const [count, setCount] = useState(0);
  const countRef = useRef(0);
  const firedRef = useRef(false);

  const record = useCallback(
    (reason: ViolationReason) => {
      if (!active || !userId || firedRef.current) return;
      countRef.current += 1;
      const n = countRef.current;
      setCount(n);

      toast.warning(`Warning ${n} of ${maxWarnings}`, {
        description: `${reason}. Further violations may result in automatic submission.`,
      });

      void supabase.from("warnings").insert({
        user_id: userId,
        round,
        reason,
        warning_number: n,
      });
      void supabase.from("activity_log").insert({
        user_id: userId,
        actor_name: actorName,
        register_number: registerNumber,
        event_type: "warning",
        round,
        detail: `Warning #${n} — ${reason}`,
      });

      if (n > maxWarnings) {
        firedRef.current = true;
        toast.error("Warning limit exceeded — submitting your attempt.");
        onLimitExceeded();
      }
    },
    [active, userId, round, maxWarnings, onLimitExceeded, actorName, registerNumber],
  );

  useEffect(() => {
    if (!active) return;

    const onVisibility = () => {
      if (document.hidden) record("Tab switched");
    };
    const onBlur = () => record("Window lost focus");
    const onCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      record("Copy attempted");
    };
    const onPaste = (e: ClipboardEvent) => {
      e.preventDefault();
      record("Paste attempted");
    };
    const onContext = (e: MouseEvent) => {
      e.preventDefault();
      record("Right click attempted");
    };
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      const devtools =
        e.key === "F12" ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && ["i", "j", "c"].includes(k)) ||
        ((e.ctrlKey || e.metaKey) && k === "u");
      if (devtools) {
        e.preventDefault();
        record("Developer tools shortcut");
        return;
      }
      if ((e.ctrlKey || e.metaKey) && k === "r") {
        e.preventDefault();
        record("Page refresh attempted");
      }
    };
    const onPopState = () => {
      history.pushState(null, "", location.href);
      record("Back navigation attempted");
    };
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    const onFullscreen = () => {
      if (!document.fullscreenElement) record("Full screen exited");
    };

    history.pushState(null, "", location.href);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", onBlur);
    document.addEventListener("copy", onCopy);
    document.addEventListener("paste", onPaste);
    document.addEventListener("contextmenu", onContext);
    document.addEventListener("keydown", onKey);
    window.addEventListener("popstate", onPopState);
    window.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("fullscreenchange", onFullscreen);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("copy", onCopy);
      document.removeEventListener("paste", onPaste);
      document.removeEventListener("contextmenu", onContext);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("popstate", onPopState);
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("fullscreenchange", onFullscreen);
    };
  }, [active, record]);

  return { warnings: count };
}
