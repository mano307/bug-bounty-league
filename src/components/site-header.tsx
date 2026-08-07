import { Link, useNavigate } from "@tanstack/react-router";
import { LogOut, Terminal, Shield } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export function SiteHeader() {
  const { user, profile, isAdmin } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid size-7 place-items-center rounded-md bg-primary/15 text-primary">
            <Terminal className="size-4" />
          </span>
          <span className="font-display text-base font-bold tracking-tight">
            Debug<span className="text-primary">X</span>
          </span>
        </Link>

        <nav className="flex items-center gap-1 text-sm">
          <Link
            to="/leaderboard"
            className="rounded-md px-3 py-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            Leaderboard
          </Link>
          {user ? (
            <>
              <Link
                to="/dashboard"
                className="rounded-md px-3 py-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                Dashboard
              </Link>
              {isAdmin && (
                <Link
                  to="/admin"
                  className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-accent transition-colors hover:bg-muted"
                >
                  <Shield className="size-3.5" /> Admin
                </Link>
              )}
              <span className="ml-2 hidden font-mono text-xs text-muted-foreground sm:inline">
                {profile?.register_number || profile?.full_name || user.email}
              </span>
              <Button variant="ghost" size="sm" onClick={signOut} aria-label="Sign out">
                <LogOut className="size-4" />
              </Button>
            </>
          ) : (
            <Button asChild size="sm">
              <Link to="/auth">Sign in</Link>
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}
