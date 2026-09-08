import Link from "next/link";
import { Menu } from "lucide-react";
import { logout } from "~/actions/auth";
import { requireAuthenticatedUser } from "~/lib/auth/dal";
import { NavLinks } from "~/components/nav-links";
import { Button } from "~/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "~/components/ui/sheet";

export async function AuthenticatedShell({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await requireAuthenticatedUser();

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40 md:flex-row">
      <header className="sticky top-0 flex shrink-0 items-center justify-between border-b bg-background p-4 md:hidden">
        <Link
          href="/"
          className="text-lg font-bold tracking-tight text-primary"
        >
          WGOTalent
        </Link>
        <Sheet>
          <SheetTrigger
            render={
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu />
                <span className="sr-only">Abrir menu de navegação</span>
              </Button>
            }
          />
          <SheetContent side="left" className="w-64 p-0">
            <SheetTitle className="sr-only">Menu de navegação</SheetTitle>
            <div className="border-b p-4 text-lg font-bold tracking-tight text-primary">
              <Link href="/">WGOTalent</Link>
            </div>
            <NavLinks
              username={user.username}
              logoutAction={logout}
              className="h-[calc(100dvh-4rem)] p-4"
            />
          </SheetContent>
        </Sheet>
      </header>

      <aside className="hidden w-64 shrink-0 flex-col border-r bg-background shadow-sm md:sticky md:top-0 md:flex md:h-screen">
        <div className="border-b p-4">
          <Link
            href="/"
            className="text-2xl font-bold tracking-tight text-primary"
          >
            WGOTalent
          </Link>
        </div>
        <NavLinks
          username={user.username}
          logoutAction={logout}
          className="flex-1 overflow-y-auto p-4"
        />
      </aside>

      <main className="flex min-h-0 flex-1 flex-col">{children}</main>
    </div>
  );
}
