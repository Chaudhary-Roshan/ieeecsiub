"use client";

import React, { useEffect } from "react";
import { usePathname } from "next/navigation";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { ensureSupabaseConnection } from "@/lib/supabase";

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");

  useEffect(() => {
    // Ensure cloud database connectivity for all visitors (public & admin)
    ensureSupabaseConnection().catch(() => {});
  }, []);

  return (
    <>
      {!isAdmin && <Header />}
      <main className="flex-1 flex flex-col">{children}</main>
      {!isAdmin && <Footer />}
    </>
  );
};
