import Link from "next/link";
import { listArchiveArticles } from "@/lib/archive/store";
import DeletePostButton from "@/components/admin/DeletePostButton";
import AdminNav from "@/components/admin/AdminNav";

export const dynamic = "force-dynamic";

export default async function AdminBlogPage() {
  const posts = await listArchiveArticles();

  return (
    <main className="min-h-screen bg-neutral-950 px-4 py-10 text-neutral-100">
      <div className="mx-auto max-w-3xl space-y-6">
        <AdminNav />
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Blog posts</h1>
          <div className="flex items-center gap-3">
            <Link
              href="/admin/blog/new"
              className="rounded bg-neutral-100 px-3 py-1.5 text-sm font-medium text-neutral-900"
            >
              New post
            </Link>
          </div>
        </div>

        {posts.length === 0 && (
          <p className="text-sm text-neutral-500">No posts yet.</p>
        )}

        <ul className="divide-y divide-neutral-800 rounded border border-neutral-800">
          {posts.map((post) => (
            <li
              key={post.slug}
              className="flex items-center justify-between gap-4 px-4 py-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{post.title}</p>
                <p className="truncate text-xs text-neutral-500">
                  {post.slug} · {post.category} · {post.publishedAt}
                  {post.featured ? " · featured" : ""}
                  {post.externalUrl ? " · external" : ""}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3 text-sm">
                <Link
                  href={post.externalUrl || `/blog/${post.slug}`}
                  target="_blank"
                  className="text-neutral-400 hover:text-neutral-200"
                >
                  View
                </Link>
                <Link
                  href={`/admin/blog/${post.slug}/edit`}
                  className="text-neutral-100 underline underline-offset-2"
                >
                  Edit
                </Link>
                <DeletePostButton slug={post.slug} />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
