import { notFound } from "next/navigation";
import { getArchiveArticle } from "@/lib/archive/store";
import BlogPostForm from "@/components/admin/BlogPostForm";
import AdminNav from "@/components/admin/AdminNav";

export const dynamic = "force-dynamic";

export default async function EditBlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getArchiveArticle(slug);
  if (!post) notFound();

  return (
    <main className="min-h-screen bg-neutral-950 px-4 py-10 text-neutral-100">
      <div className="mx-auto max-w-2xl space-y-6">
        <AdminNav />
        <h1 className="text-xl font-semibold">Edit post</h1>
        <BlogPostForm mode="edit" initialPost={post} />
      </div>
    </main>
  );
}
