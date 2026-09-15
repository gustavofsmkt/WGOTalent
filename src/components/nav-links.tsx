"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Briefcase,
  Users,
  Target,
  Bot,
  Sparkles,
  CircleUserRound,
} from "lucide-react";
import { cn } from "~/lib/utils";
import { Separator } from "~/components/ui/separator";

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Departamentos", href: "/departamentos", icon: Building2 },
  { name: "Cargos", href: "/cargos", icon: Briefcase },
  { name: "Vagas", href: "/vagas", icon: Target },
  { name: "Candidatos", href: "/candidatos", icon: Users },
];

/** Ancorados no rodapé da sidebar, acima do bloco de perfil. */
const navItemsRodape = [
  { name: "Processamentos IA", href: "/processamentos-ia", icon: Sparkles },
  { name: "Administração", href: "/admin", icon: Bot },
];

function navLinkClassName(isActive: boolean): string {
  return cn(
    "flex items-center gap-4 rounded-md px-4 py-2 font-medium transition-colors",
    isActive
      ? "bg-primary text-primary-foreground shadow-sm"
      : "text-muted-foreground hover:bg-muted hover:text-foreground",
  );
}

interface NavLinksProps {
  username: string;
  onItemClick?: () => void;
  className?: string;
}

export function NavLinks({ username, onItemClick, className }: NavLinksProps) {
  const pathname = usePathname();

  const renderItem = (item: (typeof navItems)[number]) => (
    <Link
      key={item.href}
      href={item.href}
      onClick={onItemClick}
      className={navLinkClassName(pathname.startsWith(item.href))}
    >
      <item.icon />
      {item.name}
    </Link>
  );

  return (
    <nav className={cn("flex flex-col gap-2", className)}>
      <div className="flex flex-col gap-2">{navItems.map(renderItem)}</div>

      <div className="mt-auto flex flex-col gap-2 pt-4">
        {navItemsRodape.map(renderItem)}
        <Separator />
        <Link
          href="/perfil"
          onClick={onItemClick}
          className={navLinkClassName(pathname.startsWith("/perfil"))}
        >
          <CircleUserRound />
          <span className="min-w-0">
            <span className="block">Perfil</span>
            <span className="block truncate text-xs opacity-75">
              {username}
            </span>
          </span>
        </Link>
      </div>
    </nav>
  );
}
