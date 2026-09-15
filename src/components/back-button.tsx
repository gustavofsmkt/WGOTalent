"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { buttonVariants } from "~/components/ui/button";

interface BackButtonProps {
  /** Where to go when this tab has no previous entry (direct link, new tab). */
  fallbackHref: string;
  /** Defaults to "Voltar" — the destination is the previous page, not a route. */
  children?: React.ReactNode;
}

/**
 * Returns to the previous page instead of a fixed route, so a detail page
 * reached from a filtered list goes back to that list with its filters intact.
 * Rendered as a real link to `fallbackHref` so middle-click, "open in new tab"
 * and direct entry (no history) keep working.
 */
export function BackButton({ fallbackHref, children }: BackButtonProps) {
  const router = useRouter();

  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    // Let the browser handle modifier/non-primary clicks as a plain link.
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    if (window.history.length > 1) {
      event.preventDefault();
      router.back();
    }
  };

  return (
    <Link
      href={fallbackHref}
      onClick={handleClick}
      className={buttonVariants({
        variant: "ghost",
        size: "sm",
        className: "text-muted-foreground hover:text-foreground",
      })}
    >
      <ArrowLeft className="size-4 mr-2" />
      {children ?? "Voltar"}
    </Link>
  );
}
