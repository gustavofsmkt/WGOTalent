"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Trash2, AlertTriangle } from "lucide-react";
import { toastActionPromise } from "~/lib/toast-promise";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";

interface DeleteWithConfirmButtonProps {
  onDelete: () => Promise<{ success: boolean; message?: string | null }>;
  label?: string;
  redirectTo?: string;
  variant?: "icon" | "button";
  buttonLabel?: string;
  buttonVariant?: "outline" | "destructive";
  className?: string;
}

export function DeleteWithConfirmButton({
  onDelete,
  label = "este item",
  redirectTo,
  variant = "icon",
  buttonLabel = "Excluir",
  buttonVariant = "outline",
  className,
}: DeleteWithConfirmButtonProps) {
  const router = useRouter();
  const [isConfirming, setIsConfirming] = React.useState(false);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const [coords, setCoords] = React.useState<{
    top: number;
    right: number;
  } | null>(null);

  const closeConfirm = React.useCallback(() => setIsConfirming(false), []);

  // Posiciona o popover de confirmação em relação ao gatilho. Usa position:
  // fixed + portal para não alargar a célula da tabela (que tem largura
  // reservada) nem ser recortado pelo overflow do container da DataTable.
  const updateCoords = React.useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setCoords({
      top: rect.bottom + 4,
      right: Math.max(8, window.innerWidth - rect.right),
    });
  }, []);

  React.useEffect(() => {
    if (!isConfirming) return;
    updateCoords();
    const onScroll = () => updateCoords();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeConfirm();
    };
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onScroll);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
      window.removeEventListener("keydown", onKey);
    };
  }, [isConfirming, updateCoords, closeConfirm]);

  const handleDelete = () => {
    setIsConfirming(false);
    toastActionPromise(onDelete(), {
      loading: "Excluindo...",
      success: ({ message }) => message ?? "Excluído com sucesso.",
      onSuccess: () => {
        if (redirectTo) {
          router.push(redirectTo);
        } else {
          router.refresh();
        }
      },
    });
  };

  // Variante "button" (páginas de detalhe, onde há espaço): mantém a
  // expansão inline.
  if (variant === "button" && isConfirming) {
    return (
      <div className="flex items-center gap-2 animate-in fade-in duration-200">
        <span className="hidden items-center gap-2 text-xs text-muted-foreground sm:inline-flex">
          <AlertTriangle className="size-3 text-destructive" />
          Confirmar?
        </span>
        <Button
          type="button"
          variant="destructive"
          size="sm"
          onClick={handleDelete}
          className="h-8 px-2 text-xs"
        >
          Sim, excluir
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={closeConfirm}
          className="h-8 px-2 text-xs"
        >
          Cancelar
        </Button>
      </div>
    );
  }

  const confirmPopover =
    isConfirming && coords && typeof document !== "undefined"
      ? createPortal(
          <>
            <div
              className="fixed inset-0 z-50"
              aria-hidden="true"
              onClick={closeConfirm}
            />
            <div
              role="dialog"
              aria-label={`Confirmar exclusão de ${label}`}
              className="fixed z-50 flex items-center gap-2 whitespace-nowrap rounded-lg border bg-popover p-2 text-popover-foreground shadow-md animate-in fade-in zoom-in-95 duration-150"
              style={{ top: coords.top, right: coords.right }}
            >
              <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <AlertTriangle className="size-3.5 text-destructive" />
                Excluir {label}?
              </span>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                className="h-7 px-2 text-xs"
              >
                Sim, excluir
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={closeConfirm}
                className="h-7 px-2 text-xs"
              >
                Cancelar
              </Button>
            </div>
          </>,
          document.body,
        )
      : null;

  if (variant === "button") {
    return (
      <>
        <Button
          ref={triggerRef}
          type="button"
          variant={buttonVariant}
          size="sm"
          className={cn(
            buttonVariant === "outline" &&
              "border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive",
            className,
          )}
          onClick={() => setIsConfirming(true)}
          title={`Excluir ${label}`}
          aria-label={`Excluir ${label}`}
        >
          <Trash2 className="mr-2 size-4" />
          {buttonLabel}
        </Button>
        {confirmPopover}
      </>
    );
  }

  return (
    <>
      <Button
        ref={triggerRef}
        type="button"
        variant="ghost"
        size="icon-sm"
        className={cn(
          "text-muted-foreground hover:bg-destructive/10 hover:text-destructive",
          isConfirming && "bg-destructive/10 text-destructive",
          className,
        )}
        onClick={() => setIsConfirming((v) => !v)}
        title={`Excluir ${label}`}
        aria-label={`Excluir ${label}`}
        aria-expanded={isConfirming}
      >
        <Trash2 className="size-4" />
      </Button>
      {confirmPopover}
    </>
  );
}
