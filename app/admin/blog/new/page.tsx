import BlogPostForm from "@/components/admin/BlogPostForm";
import AdminNav from "@/components/admin/AdminNav";

export default function NewBlogPostPage() {
  return (
    <main className="min-h-screen bg-neutral-950 px-4 py-10 text-neutral-100">
      <div className="mx-auto max-w-2xl space-y-6">
        <AdminNav />
        <h1 className="text-xl font-semibold">New post</h1>
        <BlogPostForm mode="create" />
      </div>
    </main>
  );
}
