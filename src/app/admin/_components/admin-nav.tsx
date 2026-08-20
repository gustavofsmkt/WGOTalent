"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bot, KeyRound } from "lucide-react";
import { cn } from "~/lib/utils";

const navItems = [
  { name: "Agentes", href: "/admin/agentes", icon: Bot },
  { name: "Credenciais", href: "/admin/credenciais", icon: KeyRound },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-1">
      {navItems.map((item) => {
        const isActive = pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <item.icon className="size-4" />
            {item.name}
          </Link>
        );
      })}
    </nav>
  );
}
