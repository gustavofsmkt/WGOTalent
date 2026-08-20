import type { ReactNode } from "react";
import Link from "next/link";
import { AdminNav } from "./_components/admin-nav";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen w-full bg-muted/40 flex flex-col">
      <header className="flex items-center justify-between p-4 border-b bg-background shrink-0 gap-4">
        <div className="font-bold text-lg tracking-tight text-primary shrink-0">
          WGOTalent — Admin
        </div>
        <AdminNav />
        <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground shrink-0">
          Voltar ao RH
        </Link>
      </header>
      <main className="flex-1 flex flex-col min-h-0 overflow-auto">{children}</main>
    </div>
  );
}
