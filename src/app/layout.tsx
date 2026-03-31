import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "../components/layout/Sidebar";
import { Header } from "../components/layout/Header";

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
    <html lang="pt-BR" className="dark">
      <body className="antialiased bg-slate-950 text-slate-50 min-h-screen flex">
        <Sidebar />
        <div className="flex-1 flex flex-col relative z-0">
          <Header />
          <main className="flex-1 p-6 lg:p-10 overflow-auto">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
