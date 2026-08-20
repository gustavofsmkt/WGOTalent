"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, XCircle, Loader2, UploadCloud } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "~/components/ui/card";
import { Field, FieldLabel, FieldDescription, FieldError } from "~/components/ui/field";
import { Button } from "~/components/ui/button";
import { Alert, AlertDescription } from "~/components/ui/alert";
import {
  uploadCurriculosEmLote,
  type UploadLoteResultado,
} from "~/actions/candidatos";

const MAX_ARQUIVOS = 15;
const MAX_TAMANHO = 5 * 1024 * 1024;
const TIPOS_ACEITOS = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/png",
  "image/jpeg",
];

export function UploadLoteForm() {
  const router = useRouter();
  const [files, setFiles] = React.useState<File[]>([]);
  const [clientError, setClientError] = React.useState<string | null>(null);
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [resultados, setResultados] = React.useState<UploadLoteResultado[] | null>(null);
  const [isPending, startTransition] = React.useTransition();

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? []);
    setResultados(null);
    setServerError(null);

    if (selected.length > MAX_ARQUIVOS) {
      setClientError(`Selecione no máximo ${MAX_ARQUIVOS} arquivos (selecionados: ${selected.length}).`);
      setFiles([]);
      return;
    }

    const invalido = selected.find(
      (f) => f.size > MAX_TAMANHO || !TIPOS_ACEITOS.includes(f.type),
    );
    if (invalido) {
      setClientError(
        `"${invalido.name}" inválido — use PDF, DOCX, PNG ou JPEG de até 5MB.`,
      );
      setFiles([]);
      return;
    }

    setClientError(null);
    setFiles(selected);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (files.length === 0) {
      setClientError("Selecione ao menos um arquivo.");
      return;
    }

    startTransition(async () => {
      setServerError(null);
      const formData = new FormData();
      files.forEach((f) => formData.append("files", f));

      const result = await uploadCurriculosEmLote(formData);

      if (!result.success) {
        setServerError(result.message ?? "Erro ao processar o lote.");
        return;
      }

      setResultados(result.data);
      setFiles([]);
      router.refresh();
    });
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Selecionar Currículos</CardTitle>
        <CardDescription>
          Cada currículo dispara o agente de extração e, se aprovado na etapa de aderência,
          a triagem completa — sem necessidade de preencher o formulário manual.
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {serverError && (
            <Alert variant="destructive">
              <AlertDescription>{serverError}</AlertDescription>
            </Alert>
          )}

          <Field data-invalid={Boolean(clientError)}>
            <FieldLabel htmlFor="upload-lote-files">Arquivos (até {MAX_ARQUIVOS})</FieldLabel>
            <input
              id="upload-lote-files"
              type="file"
              multiple
              accept=".pdf,.docx,.png,.jpg,.jpeg"
              onChange={handleFileChange}
              disabled={isPending}
              className="block w-full text-sm text-foreground file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-foreground hover:file:bg-primary/90"
            />
            <FieldDescription>PDF, DOCX, PNG ou JPEG — até 5MB cada.</FieldDescription>
            {clientError && <FieldError errors={[{ message: clientError }]} />}
          </Field>

          {files.length > 0 && (
            <p className="text-sm text-muted-foreground">
              {files.length} arquivo(s) selecionado(s).
            </p>
          )}

          {resultados && (
            <div className="space-y-2 pt-2 border-t border-border/60">
              <p className="text-sm font-medium text-foreground">Resultado do lote:</p>
              {resultados.map((r, i) => (
                <div
                  key={`${r.fileName}-${i}`}
                  className="flex items-start gap-2 text-sm rounded-md border border-border/60 p-2.5"
                >
                  {r.success ? (
                    <CheckCircle2 className="size-4 text-success shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="size-4 text-destructive shrink-0 mt-0.5" />
                  )}
                  <div className="min-w-0">
                    <p className="font-medium text-foreground truncate">{r.fileName}</p>
                    <p className="text-xs text-muted-foreground">
                      {r.success ? "Candidato criado com sucesso." : r.message}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>

        <CardFooter className="flex items-center justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => router.push("/candidatos")}>
            Voltar
          </Button>
          <Button type="submit" disabled={isPending || files.length === 0}>
            {isPending ? (
              <Loader2 className="size-4 mr-2 animate-spin" />
            ) : (
              <UploadCloud className="size-4 mr-2" />
            )}
            {isPending ? "Processando..." : "Enviar Lote"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
