import type { ReactNode } from "react";
import ArchiveShell from "@/components/archive/ArchiveShell";

export default function SignalArchiveLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <ArchiveShell>{children}</ArchiveShell>;
}
