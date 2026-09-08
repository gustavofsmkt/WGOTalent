"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Briefcase,
  Users,
  ClipboardCheck,
  Target,
  Bot,
  Sparkles,
  CircleUserRound,
  LogOut,
} from "lucide-react";
import { cn } from "~/lib/utils";
import { Button } from "~/components/ui/button";
import { Separator } from "~/components/ui/separator";

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Departamentos", href: "/departamentos", icon: Building2 },
  { name: "Cargos", href: "/cargos", icon: Briefcase },
  { name: "Vagas", href: "/vagas", icon: Target },
  { name: "Candidatos", href: "/candidatos", icon: Users },
  { name: "Triagens", href: "/triagens", icon: ClipboardCheck },
  { name: "Processamentos IA", href: "/processamentos-ia", icon: Sparkles },
  { name: "Administração", href: "/admin", icon: Bot },
];

interface NavLinksProps {
  username: string;
  logoutAction: () => Promise<never>;
  onItemClick?: () => void;
  className?: string;
}

export function NavLinks({
  username,
  logoutAction,
  onItemClick,
  className,
}: NavLinksProps) {
  const pathname = usePathname();

  return (
    <nav className={cn("flex flex-col gap-2", className)}>
      <div className="flex flex-col gap-2">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onItemClick}
              className={cn(
                "flex items-center gap-4 rounded-md px-4 py-2 font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <item.icon />
              {item.name}
            </Link>
          );
        })}
      </div>

      <div className="mt-auto flex flex-col gap-2 pt-4">
        <Separator />
        <Link
          href="/perfil"
          onClick={onItemClick}
          className={cn(
            "flex items-center gap-4 rounded-md px-4 py-2 font-medium transition-colors",
            pathname.startsWith("/perfil")
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:bg-muted hover:text-foreground",
          )}
        >
          <CircleUserRound />
          <span className="min-w-0">
            <span className="block">Perfil</span>
            <span className="block truncate text-xs opacity-75">
              {username}
            </span>
          </span>
        </Link>
        <form action={logoutAction}>
          <Button
            type="submit"
            variant="ghost"
            className="w-full justify-start"
          >
            <LogOut data-icon="inline-start" />
            Sair
          </Button>
        </form>
      </div>
    </nav>
  );
}
