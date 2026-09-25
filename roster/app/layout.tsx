import type { Metadata } from "next";
import { Figtree } from "next/font/google";
import "./globals.css";
import { WorldProvider } from "./providers";
import { Header } from "@/components/Header";

const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

export const metadata: Metadata = {
  title: "Roster — Intuit Enterprise Suite concept",
  description:
    "Concept prototype: every AI agent, partner-built agent, and human expert appears as a hire on your team.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${figtree.variable} antialiased`}>
        <WorldProvider>
          <Header />
          <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">{children}</main>
        </WorldProvider>
      </body>
    </html>
  );
}
