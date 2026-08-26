"use client";

import * as React from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Kanban, List } from "lucide-react";
import { Button } from "~/components/ui/button";

export function ViewToggle() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = React.useTransition();

  const currentView = searchParams.get("view") ?? "lista";

  const setView = (view: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (view !== "lista") {
      params.set("view", view);
    } else {
      params.delete("view");
    }
    startTransition(() => router.replace(`${pathname}?${params.toString()}`));
  };

  return (
    <div className="flex items-center gap-1 bg-muted/70 p-1 rounded-lg border border-border justify-end"> 
      <Button
        type="button"
        variant={currentView === "lista" ? "default" : "ghost"}
        size="sm"
        onClick={() => setView("lista")}
        className="h-7 px-2.5 text-xs font-medium"
        aria-pressed={currentView === "lista"}
      >
        <List className="size-3.5 mr-1.5" />
        Lista
      </Button>
      <Button
        type="button"
        variant={currentView === "pipeline" ? "default" : "ghost"}
        size="sm"
        onClick={() => setView("pipeline")}
        className="h-7 px-2.5 text-xs font-medium"
        aria-pressed={currentView === "pipeline"}
      >
        <Kanban className="size-3.5 mr-1.5" />
        Pipeline
      </Button>
    </div>
  );
}
