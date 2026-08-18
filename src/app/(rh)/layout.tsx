import type { ReactNode } from "react";
import { Menu } from "lucide-react";

import { Button } from "~/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "~/components/ui/sheet";
import { NavLinks } from "./_components/nav-links";

export default function RhLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen w-full bg-muted/40 flex flex-col md:flex-row">
      {/* Mobile Header & Nav */}
      <header className="md:hidden flex items-center justify-between p-4 border-b bg-background shrink-0">
        <div className="font-bold text-lg tracking-tight text-primary">WGOTalent</div>
        <Sheet>
          <SheetTrigger
            render={
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            }
          />
          <SheetContent side="left" className="w-64 p-0">
            <SheetTitle className="sr-only">Menu de Navegação</SheetTitle>
            <div className="p-4 border-b font-bold text-lg tracking-tight text-primary">
              WGOTalent
            </div>
            <NavLinks className="p-4" />
          </SheetContent>
        </Sheet>
      </header>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r bg-background shrink-0 shadow-sm">
        <div className="p-6 border-b">
          <div className="font-bold text-2xl tracking-tight text-primary">WGOTalent</div>
        </div>
        <NavLinks className="p-4 flex-1" />
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-h-0 overflow-auto">
        {children}
      </main>
    </div>
  );
}
