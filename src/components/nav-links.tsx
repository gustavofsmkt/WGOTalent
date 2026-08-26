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
} from "lucide-react";
import { cn } from "~/lib/utils";

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Departamentos", href: "/departamentos", icon: Building2 },
  { name: "Cargos", href: "/cargos", icon: Briefcase },
  { name: "Vagas", href: "/vagas", icon: Target },
  { name: "Candidatos", href: "/candidatos", icon: Users },
  { name: "Triagens", href: "/triagens", icon: ClipboardCheck },
  { name: "Administração", href: "/admin", icon: Bot },
];

interface NavLinksProps {
  onItemClick?: () => void;
  className?: string;
}

export function NavLinks({ onItemClick, className }: NavLinksProps) {
  const pathname = usePathname();

  return (
    <nav className={cn("flex flex-col gap-2", className)}>
      {navItems.map((item) => {
        const isActive = pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onItemClick}
            className={cn(
              "flex items-center gap-4 px-4 py-2 rounded-md transition-colors font-medium",
              isActive
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <item.icon className="h-5 w-5" />
            {item.name}
          </Link>
        );
      })}
    </nav>
  );
}
