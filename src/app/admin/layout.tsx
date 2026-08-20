import type { ReactNode } from "react";
import Link from "next/link";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen w-full bg-muted/40 flex flex-col">
      <header className="flex items-center justify-between p-4 border-b bg-background shrink-0">
        <div className="font-bold text-lg tracking-tight text-primary">
          WGOTalent — Admin
        </div>
        <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">
          Voltar ao RH
        </Link>
      </header>
      <main className="flex-1 flex flex-col min-h-0 overflow-auto">{children}</main>
    </div>
  );
}
