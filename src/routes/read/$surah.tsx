import { createFileRoute } from "@tanstack/react-router";
import { ReaderView } from "@/components/quran/reader-view";
import { surahById } from "@/lib/quran";

export const Route = createFileRoute("/read/$surah")({
  validateSearch: (search: Record<string, unknown>) => {
    const raw = Number(search.a);
    const a = Number.isFinite(raw) && raw >= 1 ? Math.floor(raw) : 1;
    return { a };
  },
  component: ReaderRoute,
  head: ({ params }) => ({
    meta: [{ title: `سورة ${surahById(Number(params.surah))?.ar ?? ""} · المصحف` }],
  }),
});

function ReaderRoute() {
  const { surah } = Route.useParams();
  const { a } = Route.useSearch();
  const id = Number(surah);
  return <ReaderView surah={id} ayah={a} />;
}
