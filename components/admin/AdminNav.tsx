import Link from "next/link";
import LogoutButton from "@/components/admin/LogoutButton";

const links = [
  { href: "/admin", label: "Control center" },
  { href: "/admin/blog", label: "Blog" },
  { href: "/admin/learning", label: "Learning" },
];

export default function AdminNav() {
  return (
    <nav className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-800 pb-4">
      <div className="flex flex-wrap items-center gap-4 text-sm">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="text-neutral-400 transition hover:text-neutral-100"
          >
            {link.label}
          </Link>
        ))}
      </div>
      <LogoutButton />
    </nav>
  );
}
