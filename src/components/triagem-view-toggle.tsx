"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Kanban, List } from "lucide-react";
import { Button } from "~/components/ui/button";

export function TriagemViewToggle() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentView = searchParams.get("view") ?? "lista";

  const setView = (view: "lista" | "pipeline") => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page");
    if (view === "pipeline") params.set("view", view);
    else params.delete("view");

    const query = params.toString();
    // Navigate directly, not inside startTransition — a wrapped navigation on
    // a dynamic route can be interrupted and require a second click.
    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  };

  return (
    <div className="flex items-center justify-end gap-2 rounded-lg border border-border bg-muted/70 p-1">
      <Button
        type="button"
        variant={currentView === "lista" ? "default" : "ghost"}
        size="sm"
        onClick={() => setView("lista")}
        className="h-7 px-2 text-xs font-medium"
        aria-pressed={currentView === "lista"}
      >
        <List className="mr-2 size-3.5" aria-hidden="true" />
        Lista
      </Button>
      <Button
        type="button"
        variant={currentView === "pipeline" ? "default" : "ghost"}
        size="sm"
        onClick={() => setView("pipeline")}
        className="h-7 px-2 text-xs font-medium"
        aria-pressed={currentView === "pipeline"}
      >
        <Kanban className="mr-2 size-3.5" aria-hidden="true" />
        Pipeline
      </Button>
    </div>
  );
}
