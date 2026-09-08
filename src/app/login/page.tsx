import { ShieldCheck, UsersRound } from "lucide-react";
import { redirect } from "next/navigation";
import { login } from "~/actions/auth";
import { getCurrentUser } from "~/lib/auth/dal";
import { LoginForm } from "./_components/login-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";

export const metadata = {
  title: "Entrar | WGOTalent",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  if (await getCurrentUser()) redirect("/dashboard");

  const { next = "/dashboard" } = await searchParams;

  return (
    <main className="grid min-h-screen bg-muted/40 lg:grid-cols-[minmax(20rem,0.9fr)_minmax(28rem,1.1fr)]">
      <section className="hidden flex-col justify-between border-r bg-primary p-10 text-primary-foreground lg:flex">
        <div className="text-2xl font-semibold tracking-tight">WGOTalent</div>
        <div className="max-w-md">
          <UsersRound className="mb-6 size-10" aria-hidden="true" />
          <h1 className="text-balance text-4xl font-semibold tracking-tight">
            Seu processo seletivo, em um só lugar.
          </h1>
          <p className="mt-4 text-base leading-relaxed opacity-80">
            Acesse vagas, candidatos e triagens com suas credenciais da
            plataforma.
          </p>
        </div>
        <p className="text-sm opacity-70">Seleção e triagem de talentos</p>
      </section>

      <section className="flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-md">
          <div className="mb-6 flex items-center gap-3 lg:hidden">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <ShieldCheck aria-hidden="true" />
            </div>
            <span className="text-xl font-semibold tracking-tight">
              WGOTalent
            </span>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Entrar na plataforma</CardTitle>
              <CardDescription>
                Informe seu usuário e senha para continuar.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LoginForm action={login} nextPath={next} />
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}
