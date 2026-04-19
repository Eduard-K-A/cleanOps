import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ClientToaster } from "@/components/ClientToaster";
import { AuthProvider } from "@/lib/authContext";
import { NotificationListener } from "@/components/NotificationListener";
import { Toaster as SonnerToaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CleanOps — Cleaning jobs marketplace",
  description: "Book cleaning jobs. Escrow payments, real-time updates.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <ClientToaster />
          <SonnerToaster position="top-right" expand={true} richColors />
          <NotificationListener />
          <div className="min-h-main-content">{children}</div>
        </AuthProvider>
      </body>
    </html>
  );
}
