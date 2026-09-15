"use client";

import { Sparkles } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { cn } from "~/lib/utils";

interface AiScoreBadgeProps {
  /** 0–100 AI score. Accepts the numeric string Drizzle returns for `numeric`. */
  score: string | number | null | undefined;
  /** AI rationale shown in the tooltip. Falls back to the raw score. */
  parecer?: string | null;
  className?: string;
}

/**
 * Single rendering of the AI score across the app (triagens list and pipeline,
 * vaga detail, candidato detail, dashboard). Renders an em dash when there is
 * no evaluation, so table cells can pass the value through unguarded.
 */
export function AiScoreBadge({ score, parecer, className }: AiScoreBadgeProps) {
  const value =
    score === null || score === undefined || score === ""
      ? Number.NaN
      : Math.round(Number(score));

  if (Number.isNaN(value)) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <span
            // Focusable so the parecer is reachable without a pointer.
            tabIndex={0}
            aria-label={`Score IA: ${value} de 100`}
            className={cn(
              "inline-flex items-center gap-2 rounded-md border border-primary/20 bg-primary/10 px-2 text-xs font-semibold text-primary",
              className,
            )}
          />
        }
      >
        <Sparkles className="size-3 text-primary" aria-hidden="true" />
        {value}%
      </TooltipTrigger>
      <TooltipContent className="block max-w-sm text-left leading-relaxed whitespace-pre-line">
        {parecer || `Score IA: ${value}/100`}
      </TooltipContent>
    </Tooltip>
  );
}
