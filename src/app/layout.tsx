import "~/styles/globals.css";

import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "~/components/ui/sheet";
import { type Metadata } from "next";
import dynamic from "next/dynamic";
import { Inter } from "next/font/google";
import { Toaster } from "~/components/ui/toast";
import { NavLinks } from "~/components/nav-links";
import { UploadProgressProvider } from "~/components/upload-progress/upload-progress-store";
import { Button } from "~/components/ui/button";
import { Menu } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "WGOTalent",
  description: "Plataforma de Seleção e Triagem de Talentos",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const UploadProgressPopup = dynamic(() =>
  import("~/components/upload-progress/upload-progress-popup").then(
    (m) => m.UploadProgressPopup,
  ),
);

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={`${inter.variable} antialiased`}>
      <body className="font-sans">
        <UploadProgressProvider>
          <div className="min-h-screen w-full bg-muted/40 flex flex-col md:flex-row">
            {/* Mobile Header & Nav */}
            <header className="md:hidden sticky top-0 z-50 flex items-center justify-between p-4 border-b bg-background shrink-0">
              <div className="font-bold text-lg tracking-tight text-primary">
                <Link href="/">WGOTalent</Link>
              </div>
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
                    <Link href="/">WGOTalent</Link>
                  </div>
                  <NavLinks className="p-4" />
                </SheetContent>
              </Sheet>
            </header>

            {/* Desktop Sidebar */}
            <aside className="hidden md:flex md:sticky md:top-0 md:h-screen w-64 flex-col border-r bg-background shrink-0 shadow-sm">
              <div className="p-4 border-b">
                <div className="font-bold text-2xl tracking-tight text-primary">
                  <Link href="/">WGOTalent</Link>
                </div>
              </div>
              <NavLinks className="p-4 flex-1 overflow-y-auto" />
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col min-h-0">{children}</main>
          </div>
          <UploadProgressPopup />
        </UploadProgressProvider>
        <Toaster />
      </body>
    </html>
  );
}
