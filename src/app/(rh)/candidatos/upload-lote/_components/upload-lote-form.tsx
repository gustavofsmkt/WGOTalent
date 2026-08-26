"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { UploadCloud, CheckCircle2 } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "~/components/ui/card";
import {
  Field,
  FieldLabel,
  FieldDescription,
  FieldError,
} from "~/components/ui/field";
import { Button } from "~/components/ui/button";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { iniciarUploadLote } from "~/actions/candidatos";
import { useUploadProgress } from "~/components/upload-progress/upload-progress-store";

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
  const { seedItems } = useUploadProgress();
  const [files, setFiles] = React.useState<File[]>([]);
  const [clientError, setClientError] = React.useState<string | null>(null);
  const [enqueuedMessage, setEnqueuedMessage] = React.useState<string | null>(
    null,
  );
  const [isEnqueuing, setIsEnqueuing] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? []);
    setEnqueuedMessage(null);

    if (selected.length > MAX_ARQUIVOS) {
      setClientError(
        `Selecione no máximo ${MAX_ARQUIVOS} arquivos (selecionados: ${selected.length}).`,
      );
      setFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
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
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setClientError(null);
    setFiles(selected);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (files.length === 0) {
      setClientError("Selecione ao menos um arquivo.");
      return;
    }

    setIsEnqueuing(true);
    setClientError(null);

    const formData = new FormData();
    files.forEach((f) => formData.append("files", f));

    // Só aguarda a criação dos registros do lote — o processamento em si
    // roda no servidor, sem bloquear este botão nem a navegação.
    const result = await iniciarUploadLote(formData);
    setIsEnqueuing(false);

    if (!result.success) {
      setClientError(result.message ?? "Erro ao enfileirar o lote.");
      return;
    }

    seedItems(result.data);
    setEnqueuedMessage(
      `Lote de ${result.data.length} arquivo(s) enfileirado para processamento. Você pode acompanhar o progresso no painel e navegar livremente pelo sistema.`,
    );
    setFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Selecionar Currículos</CardTitle>
        <CardDescription>
          Cada currículo dispara o agente de extração e, se aprovado na etapa de
          aderência, a triagem completa — sem necessidade de preencher o
          formulário manual.
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {enqueuedMessage && (
            <Alert className="border-primary/40 bg-primary/5 text-primary">
              <CheckCircle2 className="size-4" />
              <AlertDescription>{enqueuedMessage}</AlertDescription>
            </Alert>
          )}

          <Field data-invalid={Boolean(clientError)}>
            <FieldLabel htmlFor="upload-lote-files">
              Arquivos (até {MAX_ARQUIVOS})
            </FieldLabel>
            <input
              ref={fileInputRef}
              id="upload-lote-files"
              type="file"
              multiple
              accept=".pdf,.docx,.png,.jpg,.jpeg"
              onChange={handleFileChange}
              disabled={isEnqueuing}
              className="block w-full text-sm text-foreground file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer"
            />
            <FieldDescription>
              PDF, DOCX, PNG ou JPEG — até 5MB cada.
            </FieldDescription>
            {clientError && <FieldError errors={[{ message: clientError }]} />}
          </Field>

          {files.length > 0 && (
            <p className="text-sm text-muted-foreground">
              {files.length} arquivo(s) selecionado(s).
            </p>
          )}
        </CardContent>

        <CardFooter className="flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/candidatos")}
          >
            Voltar
          </Button>
          <Button type="submit" disabled={isEnqueuing || files.length === 0}>
            <UploadCloud className="size-4 mr-2" />
            {isEnqueuing ? "Enfileirando..." : "Enviar Lote"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
