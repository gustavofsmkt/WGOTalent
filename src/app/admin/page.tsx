import Link from "next/link";
import { PageHeader } from "~/components/page-header";
import { Card, CardContent } from "~/components/ui/card";
import { Button, buttonVariants } from "~/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "~/components/ui/tabs";

import { agenteConfigRepository } from "~/server/db/repositories/agente-config";
import { llmCredencialRepository } from "~/server/db/repositories/llm-credencial";
import { emailCredencialRepository } from "~/server/db/repositories/email-credencial";
import {
  getProviderLabel,
  getModelsForProvider,
} from "~/lib/agents/provider-catalog";

import { CreateCredencialForm } from "./credenciais/_components/create-credencial-form";
import { DeactivateCredencialButton } from "./credenciais/_components/deactivate-credencial-button";
import { DeleteCredencialButton } from "./credenciais/_components/delete-credencial-button";
import { CreateEmailCredencialForm } from "./email/_components/create-email-credencial-form";
import { DeactivateEmailCredencialButton } from "./email/_components/deactivate-email-credencial-button";
import { DeleteEmailCredencialButton } from "./email/_components/delete-email-credencial-button";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Administração | WGOTalent",
};

export default async function AdminPage() {
  const [agentes, credenciais, emailCredenciais] = await Promise.all([
    agenteConfigRepository.findAll(),
    llmCredencialRepository.findAll(),
    emailCredencialRepository.findAll(),
  ]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto w-full">
      <PageHeader
        title="Administração"
        description="Gerencie agentes, credenciais e configurações da plataforma."
      />

      <Tabs defaultValue="agentes" className="mt-8">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
          <TabsTrigger value="agentes">Agentes</TabsTrigger>
          <TabsTrigger value="credenciais">Credenciais</TabsTrigger>
          <TabsTrigger value="email">Captação de E-mail</TabsTrigger>
          <TabsTrigger value="configuracoes">Configurações Gerais</TabsTrigger>
        </TabsList>

        <TabsContent value="agentes" className="mt-6">
          <div className="space-y-3">
            {agentes.map((agente) => (
              <Card key={agente.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <div className="font-medium">
                      {agente.slot
                        .split("_")
                        .map(
                          (word) =>
                            word.charAt(0).toUpperCase() + word.slice(1),
                        )
                        .join(" ")}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {getProviderLabel(agente.provider)} ·{" "}
                      {getModelsForProvider(agente.provider).find(
                        (m) => m.value === agente.model,
                      )?.label ?? agente.model}{" "}
                      · {agente.ativo ? "ativo" : "inativo"}
                    </div>
                  </div>
                  <Button variant="outline">
                    <Link href={`/admin/agentes/${agente.slot}`}>Editar</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="credenciais" className="mt-6 space-y-8">
          <div className="space-y-3">
            {credenciais.length === 0 ? (
              <p className="text-sm text-muted-foreground ml-1">
                Nenhuma credencial cadastrada.
              </p>
            ) : (
              credenciais.map((c) => (
                <Card key={c.id}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div>
                      <div className="font-medium">
                        {getProviderLabel(c.provider)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {c.ativo ? "ativa" : "inativa"} · cadastrada em{" "}
                        {new Date(c.createdAt).toLocaleDateString("pt-BR")}
                      </div>
                    </div>
                    {c.ativo ? (
                      <DeactivateCredencialButton credencialId={c.id} />
                    ) : (
                      <DeleteCredencialButton credencialId={c.id} />
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
          <CreateCredencialForm />
        </TabsContent>

        <TabsContent value="email" className="mt-6 space-y-8">
          <div className="space-y-3">
            {emailCredenciais.length === 0 ? (
              <p className="text-sm text-muted-foreground ml-1">
                Nenhuma credencial cadastrada.
              </p>
            ) : (
              emailCredenciais.map((c) => (
                <Card key={c.id}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div>
                      <div className="font-medium">
                        {c.usuario} · {c.host}:{c.porta}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Pasta: {c.pasta} · {c.ativo ? "ativa" : "inativa"} ·
                        cadastrada em{" "}
                        {new Date(c.createdAt).toLocaleDateString("pt-BR")}
                      </div>
                    </div>
                    {c.ativo ? (
                      <DeactivateEmailCredencialButton credencialId={c.id} />
                    ) : (
                      <DeleteEmailCredencialButton credencialId={c.id} />
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
          <CreateEmailCredencialForm />
        </TabsContent>

        <TabsContent value="configuracoes" className="mt-6">
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              Configurações gerais da plataforma — em breve.
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
