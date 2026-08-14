import AdminNav from "@/components/admin/AdminNav";
import LearningControlPanel from "@/components/admin/LearningControlPanel";
import { listLearningTracks } from "@/lib/learning/store";
import type { LearningTrackWithEntries } from "@/@types/learning.type";

export const dynamic = "force-dynamic";

export default async function AdminLearningPage() {
  let tracks: LearningTrackWithEntries[] = [];
  let unavailable = false;
  try {
    tracks = await listLearningTracks();
  } catch (error) {
    console.error("Admin learning page could not load", error);
    unavailable = true;
  }

  return (
    <main className="min-h-screen bg-neutral-950 px-4 py-10 text-neutral-100">
      <div className="mx-auto max-w-5xl space-y-7">
        <AdminNav />
        <header>
          <h1 className="text-2xl font-semibold">Learning system</h1>
          <p className="mt-2 text-sm text-neutral-500">
            Shared database tracks replace per-browser local storage. Public
            visitors can read; only this control plane and scoped MCP tools can
            write.
          </p>
        </header>
        {unavailable ? (
          <p className="rounded-lg border border-amber-900/60 bg-amber-950/20 px-4 py-3 text-sm text-amber-300">
            The database is unavailable. Check DATABASE_URL, then reload this
            page.
          </p>
        ) : (
          <LearningControlPanel initialTracks={tracks} />
        )}
      </div>
    </main>
  );
}
