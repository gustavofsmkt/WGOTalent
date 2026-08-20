"use client";

import { CheckCircle2, XCircle, Loader2, AlertTriangle, X, Trash2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { useUploadProgress } from "./upload-progress-store";
import { temItemEmAndamento, temErroPendente } from "./upload-progress-status";

export function UploadProgressPopup() {
  const { items, isOpen, limparFinalizados, dismiss } = useUploadProgress();

  if (!isOpen || items.length === 0) {
    return null;
  }

  const hasErrors = temErroPendente(items);
  const isProcessing = temItemEmAndamento(items);
  const successCount = items.filter((i) => i.status === "sucesso").length;
  const errorCount = items.filter((i) => i.status === "erro").length;
  const temFinalizados = successCount + errorCount > 0;

  return (
    <div
      className="fixed bottom-4 right-4 z-50 w-80 sm:w-96 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-200"
      role="region"
      aria-label="Progresso de upload"
    >
      <Card className="border-border/80 bg-background/95 backdrop-blur shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 pb-2 border-b">
          <div className="flex items-center gap-2">
            {isProcessing ? (
              <Loader2 className="size-4 animate-spin text-primary" />
            ) : hasErrors ? (
              <AlertTriangle className="size-4 text-destructive" />
            ) : (
              <CheckCircle2 className="size-4 text-success" />
            )}
            <CardTitle className="text-sm font-semibold">
              {isProcessing
                ? `Processando currículos (${successCount + errorCount}/${items.length})`
                : hasErrors
                  ? `Upload concluído com ${errorCount} erro(s)`
                  : `Upload concluído (${successCount}/${items.length})`}
            </CardTitle>
          </div>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={dismiss}
            aria-label="Fechar popup"
            className="h-6 w-6 text-muted-foreground hover:text-foreground"
          >
            <X className="size-3.5" />
          </Button>
        </CardHeader>

        <CardContent className="p-3 space-y-2 max-h-56 overflow-y-auto">
          {hasErrors && (
            <Alert variant="destructive" className="py-2 px-3 text-xs">
              <AlertDescription>Alguns arquivos falharam no processamento.</AlertDescription>
            </Alert>
          )}

          <div className="space-y-1.5">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-start gap-2 text-xs rounded-md border border-border/60 p-2 bg-muted/20"
              >
                {(item.status === "pendente" || item.status === "processando") && (
                  <Loader2 className="size-3.5 animate-spin text-primary shrink-0 mt-0.5" />
                )}
                {item.status === "sucesso" && (
                  <CheckCircle2 className="size-3.5 text-success shrink-0 mt-0.5" />
                )}
                {item.status === "erro" && (
                  <XCircle className="size-3.5 text-destructive shrink-0 mt-0.5" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-foreground truncate">{item.fileName}</p>
                  {item.mensagem && (
                    <p
                      className={`text-[11px] truncate ${
                        item.status === "erro" ? "text-destructive" : "text-muted-foreground"
                      }`}
                    >
                      {item.mensagem}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>

        <CardFooter className="p-2.5 pt-0 flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => void limparFinalizados()}
            disabled={!temFinalizados}
            className="text-xs h-7 gap-1"
          >
            <Trash2 className="size-3" />
            Limpar
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
