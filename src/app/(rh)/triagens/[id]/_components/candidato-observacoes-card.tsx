"use client";

import * as React from "react";
import { Loader2, NotebookPen, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Textarea } from "~/components/ui/textarea";
import { Button } from "~/components/ui/button";
import { toast } from "~/components/ui/toast";
import { updateObservacoesRhCandidato } from "~/actions/candidatos";

interface CandidatoObservacoesCardProps {
  candidatoId: string;
  initialValue: string | null;
}

export function CandidatoObservacoesCard({
  candidatoId,
  initialValue,
}: CandidatoObservacoesCardProps) {
  const [value, setValue] = React.useState(initialValue ?? "");
  const [isSaving, setIsSaving] = React.useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = React.useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const autoSaveTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const autoSaveClearRef = React.useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const save = async (text: string) => {
    setAutoSaveStatus("saving");
    const result = await updateObservacoesRhCandidato(
      candidatoId,
      text.trim() || null,
    );
    if (result.success) {
      setAutoSaveStatus("saved");
      if (autoSaveClearRef.current) clearTimeout(autoSaveClearRef.current);
      autoSaveClearRef.current = setTimeout(
        () => setAutoSaveStatus("idle"),
        3000,
      );
    } else {
      setAutoSaveStatus("error");
    }
  };

  const scheduleAutoSave = (text: string) => {
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(() => void save(text), 1000);
  };

  const handleManualSave = async () => {
    if (isSaving) return;
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    if (autoSaveClearRef.current) clearTimeout(autoSaveClearRef.current);
    setIsSaving(true);
    const result = await updateObservacoesRhCandidato(
      candidatoId,
      value.trim() || null,
    );
    setIsSaving(false);
    if (!result.success) {
      toast.add({ type: "error", description: result.message ?? "Erro ao salvar." });
      return;
    }
    setAutoSaveStatus("idle");
    toast.add({ type: "success", description: "Observações salvas." });
  };

  const handleBlur = () => {
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    void save(value);
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <NotebookPen className="h-4 w-4 text-primary" />
          Observações do RH
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Textarea
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            scheduleAutoSave(e.target.value);
          }}
          onBlur={handleBlur}
          placeholder="Anotações internas do RH sobre este candidato..."
          rows={4}
          disabled={isSaving}
        />
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground">
            {autoSaveStatus === "saving" && (
              <span className="flex items-center gap-1">
                <Loader2 className="size-3 animate-spin" />
                Salvando...
              </span>
            )}
            {autoSaveStatus === "saved" && "Salvo automaticamente"}
            {autoSaveStatus === "error" && (
              <span className="text-destructive">Erro ao salvar</span>
            )}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleManualSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            Salvar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
