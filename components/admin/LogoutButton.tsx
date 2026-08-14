"use client";

import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      className="rounded border border-neutral-700 px-3 py-1.5 text-sm text-neutral-400 hover:text-neutral-100"
    >
      Log out
    </button>
  );
}
