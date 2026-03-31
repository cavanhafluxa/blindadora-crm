import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "../components/layout/Sidebar";
import { Header } from "../components/layout/Header";

const inter = Inter({ subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: "PROBlind CRM | Gestão para Blindadoras",
  description: "Sistema ERP completo para blindadoras automotivas.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={inter.className}>
      <body className="antialiased bg-[#f3f5f8] text-slate-800 min-h-screen flex selection:bg-indigo-500/30">
        <Sidebar />
        <div className="flex-1 flex flex-col relative z-0 ml-[280px]">
          <Header />
          <main className="flex-1 p-6 lg:p-8 xl:p-10 overflow-auto">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
