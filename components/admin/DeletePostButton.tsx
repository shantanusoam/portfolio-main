"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DeletePostButton({ slug }: { slug: string }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm(`Delete "${slug}"? This cannot be undone.`)) return;

    setDeleting(true);
    const res = await fetch(`/api/admin/blog/${slug}`, { method: "DELETE" });
    setDeleting(false);

    if (res.ok) {
      router.refresh();
    } else {
      alert("Failed to delete post.");
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={deleting}
      className="text-red-400 hover:text-red-300 disabled:opacity-50"
    >
      {deleting ? "Deleting…" : "Delete"}
    </button>
  );
}
