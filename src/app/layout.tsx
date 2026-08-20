import "~/styles/globals.css";

import { type Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "~/components/ui/sonner";

export const metadata: Metadata = {
  title: "WGOTalent",
  description: "Plataforma de Seleção e Triagem de Talentos",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={`${inter.variable} antialiased`}>
      <body className="font-sans">
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
