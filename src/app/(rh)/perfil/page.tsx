import { CalendarDays, Clock3, UserRound } from "lucide-react";
import { changeOwnPassword } from "~/actions/usuarios";
import { requireAuthenticatedUser } from "~/lib/auth/dal";
import { PageHeader } from "~/components/page-header";
import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Separator } from "~/components/ui/separator";
import { ChangePasswordDialog } from "./_components/change-password-dialog";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Perfil | WGOTalent",
};

export default async function PerfilPage() {
  const user = await requireAuthenticatedUser();
  const initial = user.username.charAt(0).toUpperCase();

  return (
    <div className="mx-auto w-full max-w-4xl p-4">
      <PageHeader
        title="Perfil"
        description="Consulte os dados da sua conta e mantenha sua senha atualizada."
      />

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Avatar className="size-11">
              <AvatarFallback>{initial}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle>{user.username}</CardTitle>
              <CardDescription>Conta com acesso ao WGOTalent</CardDescription>
            </div>
          </div>
          <CardAction>
            <ChangePasswordDialog action={changeOwnPassword} />
          </CardAction>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Separator />
          <dl className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-start gap-3">
              <UserRound className="mt-0.5 text-muted-foreground" />
              <div>
                <dt className="text-xs text-muted-foreground">Usuário</dt>
                <dd className="font-medium">{user.username}</dd>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CalendarDays className="mt-0.5 text-muted-foreground" />
              <div>
                <dt className="text-xs text-muted-foreground">
                  Conta criada em
                </dt>
                <dd className="font-medium">
                  {new Date(user.createdAt).toLocaleDateString("pt-BR")}
                </dd>
              </div>
            </div>
            <div className="flex items-start gap-3 sm:col-span-2">
              <Clock3 className="mt-0.5 text-muted-foreground" />
              <div>
                <dt className="text-xs text-muted-foreground">
                  Credenciais atualizadas em
                </dt>
                <dd className="font-medium">
                  {new Date(user.updatedAt).toLocaleString("pt-BR")}
                </dd>
              </div>
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
