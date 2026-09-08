import Link from "next/link";
import { ArrowLeft, UsersRound } from "lucide-react";
import { createUsuario, resetUsuarioPassword } from "~/actions/usuarios";
import { requireAuthenticatedUser } from "~/lib/auth/dal";
import { usuarioRepository } from "~/server/db/repositories/usuario";
import { PageHeader } from "~/components/page-header";
import { buttonVariants } from "~/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "~/components/ui/empty";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { CreateUsuarioForm } from "./_components/create-usuario-form";
import { ResetPasswordButton } from "./_components/reset-password-button";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Usuários | Administração | WGOTalent",
};

export default async function UsuariosPage() {
  const currentUser = await requireAuthenticatedUser();
  const users = await usuarioRepository.findAll();

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 p-4">
      <div>
        <Link
          href="/admin"
          className={buttonVariants({ variant: "ghost", size: "sm" })}
        >
          <ArrowLeft data-icon="inline-start" />
          Voltar para Administração
        </Link>
      </div>

      <PageHeader
        title="Usuários"
        description="Gerencie as contas que podem acessar a plataforma."
      />

      {users.length === 0 ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <UsersRound />
            </EmptyMedia>
            <EmptyTitle>Nenhum usuário cadastrado</EmptyTitle>
            <EmptyDescription>
              Adicione o primeiro usuário para liberar o acesso.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuário</TableHead>
                <TableHead>Criado em</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    {user.username}
                    {user.id === currentUser.id ? (
                      <span className="ml-2 text-xs font-normal text-muted-foreground">
                        Você
                      </span>
                    ) : null}
                  </TableCell>
                  <TableCell>
                    {new Date(user.createdAt).toLocaleDateString("pt-BR")}
                  </TableCell>
                  <TableCell className="text-right">
                    <ResetPasswordButton
                      userId={user.id}
                      username={user.username}
                      action={resetUsuarioPassword}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <CreateUsuarioForm action={createUsuario} />
    </div>
  );
}
