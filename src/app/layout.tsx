import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/layout/AppShell";

export const metadata: Metadata = {
  title: "IEEE Computer Society Student Branch Chapter | UCET-IUB",
  description:
    "Official website of IEEE Computer Society Student Branch Chapter at University College of Engineering & Technology, The Islamia University of Bahawalpur. Verify certificates, explore events, and connect.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen flex flex-col bg-white">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
