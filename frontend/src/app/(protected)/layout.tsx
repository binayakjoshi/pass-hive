import AppShell from "@/components/navigation/shell";
import type { ReactNode } from "react";

export default function AppGroupLayout({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
