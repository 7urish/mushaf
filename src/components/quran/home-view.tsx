import { useMemo, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Bookmark, Moon, Search, Settings, Sun } from "lucide-react";
import {
  BISMILLAH,
  filterSurahs,
  juz,
  juzOf,
  pageOf,
  placeLabel,
  searchAyahs,
  surahById,
  toArabicDigits,
  globalIndex,
} from "@/lib/quran";
import { useHydrated, useMushaf } from "@/lib/store";
import { useQuranText } from "@/lib/use-text";
import { PlayerDock } from "@/components/quran/audio";
import { SettingsSheet } from "@/components/quran/settings";

const QUICK = [
  { label: "آية الكرسي", s: 2, a: 255 },
  { label: "يس", s: 36, a: 1 },
  { label: "الرحمن", s: 55, a: 1 },
  { label: "الملك", s: 67, a: 1 },
  { label: "الكهف", s: 18, a: 1 },
  { label: "الإخلاص", s: 112, a: 1 },
];

type Tab = "surah" | "juz" | "marks";

export function HomeView() {
  const navigate = useNavigate();
  const hydrated = useHydrated();
  const last = useMushaf((state) => state.last);
  const bookmarks = useMushaf((state) => state.bookmarks);
  const theme = useMushaf((state) => state.theme);
  const setTheme = useMushaf((state) => state.setTheme);
  const toggleBookmark = useMushaf((state) => state.toggleBookmark);
  const { text, error, retry } = useQuranText();
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<Tab>("surah");
  const [settings, setSettings] = useState(false);

  const surahHits = useMemo(() => filterSurahs(query), [query]);
  const ayahHits = useMemo(() => (text && query.trim().length >= 2 ? searchAyahs(text, query) : []), [text, query]);
  const searching = query.trim().length > 0;
  const lastMeta = last ? surahById(last.s) : undefined;
  const lastPage = last ? pageOf(globalIndex(last.s, last.a)) : null;
  const lastJuz = last ? juzOf(globalIndex(last.s, last.a)) : null;

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-30 border-b border-line bg-bg/95 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <Mark className="size-6 text-gold" />
            <div>
              <p className="text-base font-semibold leading-none">المصحف</p>
              <p className="mt-1 text-xs text-muted">حفص عن عاصم</p>
            </div>
          </div>
          <div className="flex items-center">
            <button
              type="button"
              aria-label={theme === "night" ? "المظهر النهاري" : "المظهر الليلي"}
              onClick={() => setTheme(theme === "night" ? "day" : "night")}
              className="grid h-11 w-11 place-items-center"
            >
              {theme === "night" ? <Sun className="size-5" /> : <Moon className="size-5" />}
            </button>
            <button type="button" aria-label="الإعدادات" onClick={() => setSettings(true)} className="grid h-11 w-11 place-items-center">
              <Settings className="size-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-2xl flex-col gap-5 px-4 pt-5 pb-40">
        {hydrated && last && lastMeta && lastPage && lastJuz ? (
          <Link
            to="/read/$surah"
            params={{ surah: String(last.s) }}
            search={{ a: last.a }}
            className="block rounded-2xl border border-line bg-surface px-5 py-5"
          >
            <p className="text-xs text-gold">تابع القراءة</p>
            <p className="mt-1 text-2xl font-semibold">سورة {lastMeta.ar}</p>
            <p className="mt-1 text-sm text-muted">
              الآية {toArabicDigits(last.a)} · الصفحة {toArabicDigits(lastPage)} · الجزء {toArabicDigits(lastJuz)}
            </p>
          </Link>
        ) : (
          <Link
            to="/read/$surah"
            params={{ surah: "1" }}
            search={{ a: 1 }}
            className="block rounded-2xl border border-line bg-surface px-5 py-6 text-center"
          >
            <p className="basmala text-3xl text-gold">{BISMILLAH}</p>
            <p className="mt-3 text-sm text-muted">ابدأ التلاوة من سورة الفاتحة</p>
          </Link>
        )}

        <div className="scroller">
          {QUICK.map((item) => (
            <Link
              key={item.label}
              to="/read/$surah"
              params={{ surah: String(item.s) }}
              search={{ a: item.a }}
              className="shrink-0 rounded-full border border-line bg-surface px-4 py-2 text-sm"
            >
              {item.label}
            </Link>
          ))}
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            const exact = surahHits.length === 1 ? surahHits[0] : undefined;
            if (exact) {
              void navigate({
                to: "/read/$surah",
                params: { surah: String(exact.i) },
                search: { a: 1 },
              });
            }
          }}
        >
          <label className="flex min-h-12 items-center gap-2 rounded-xl border border-line bg-surface px-3">
            <Search className="size-4 shrink-0 text-faint" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="ابحث باسم السورة أو بنص الآية"
              className="h-11 w-full bg-transparent text-sm text-fg outline-none placeholder:text-faint"
              enterKeyHint="search"
            />
          </label>
        </form>

        {!searching ? (
          <div className="grid grid-cols-3 rounded-xl bg-surface-2 p-1">
            {(
              [
                ["surah", "السور"],
                ["juz", "الأجزاء"],
                ["marks", "المحفوظات"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                aria-pressed={tab === id}
                onClick={() => setTab(id)}
                className={
                  "min-h-11 rounded-lg text-sm font-medium " +
                  (tab === id ? "bg-bg text-fg" : "text-muted")
                }
              >
                {label}
              </button>
            ))}
          </div>
        ) : null}

        {error ? (
          <div className="rounded-xl border border-line bg-surface px-4 py-3 text-sm">
            <p>{error}</p>
            <button type="button" onClick={retry} className="mt-2 text-gold">
              إعادة المحاولة
            </button>
          </div>
        ) : null}

        {searching ? (
          <section className="flex flex-col">
            <h2 className="mb-2 text-xs text-muted">السور</h2>
            {surahHits.length === 0 ? <p className="text-sm text-muted">لا توجد سورة بهذا الاسم.</p> : null}
            <SurahList items={surahHits} />
            {query.trim().length >= 2 ? (
              <>
                <h2 className="mt-5 mb-2 text-xs text-muted">في الآيات</h2>
                {!text ? <p className="text-sm text-muted">يتم تحضير نص المصحف للبحث…</p> : null}
                {text && ayahHits.length === 0 ? <p className="text-sm text-muted">لا توجد آيات مطابقة.</p> : null}
                <div className="flex flex-col">
                  {ayahHits.map((hit) => {
                    const meta = surahById(hit.s);
                    return (
                      <Link
                        key={`${hit.s}-${hit.a}`}
                        to="/read/$surah"
                        params={{ surah: String(hit.s) }}
                        search={{ a: hit.a }}
                        className="border-b border-line py-3"
                      >
                        <p className="text-xs text-gold">
                          {meta?.ar} · {toArabicDigits(hit.a)}
                        </p>
                        <p className="quran-text line-clamp-2 text-lg">{hit.text}</p>
                      </Link>
                    );
                  })}
                </div>
              </>
            ) : null}
          </section>
        ) : null}

        {!searching && tab === "surah" ? <SurahList items={filterSurahs("")} /> : null}

        {!searching && tab === "juz" ? (
          <div className="flex flex-col">
            {juz.map((item, index) => {
              const meta = surahById(item.s);
              return (
                <Link
                  key={index}
                  to="/read/$surah"
                  params={{ surah: String(item.s) }}
                  search={{ a: item.a }}
                  className="flex min-h-16 items-center justify-between gap-3 border-b border-line py-3"
                >
                  <span>
                    <span className="block font-medium">الجزء {toArabicDigits(index + 1)}</span>
                    <span className="block text-sm text-muted">
                      من {meta?.ar} · الآية {toArabicDigits(item.a)}
                    </span>
                  </span>
                  <span className="text-sm text-faint">ص {toArabicDigits(pageOf(globalIndex(item.s, item.a)))}</span>
                </Link>
              );
            })}
          </div>
        ) : null}

        {!searching && tab === "marks" ? (
          <div className="flex flex-col">
            {bookmarks.length === 0 ? (
              <p className="rounded-xl border border-line bg-surface px-4 py-6 text-sm text-muted">
                لم تحفظ آيات بعد. افتح سورة، ثم اضغط علامة الحفظ في شريط التلاوة.
              </p>
            ) : (
              bookmarks.map((mark) => {
                const meta = surahById(mark.s);
                const preview = text?.[mark.s - 1]?.[mark.a - 1];
                return (
                  <div key={`${mark.s}-${mark.a}`} className="flex items-start gap-2 border-b border-line py-3">
                    <Link
                      to="/read/$surah"
                      params={{ surah: String(mark.s) }}
                      search={{ a: mark.a }}
                      className="min-w-0 flex-1"
                    >
                      <p className="text-sm font-medium">
                        {meta?.ar} · الآية {toArabicDigits(mark.a)}
                      </p>
                      {preview ? <p className="quran-text line-clamp-2 text-lg text-muted">{preview}</p> : null}
                    </Link>
                    <button
                      type="button"
                      aria-label="إزالة من المحفوظات"
                      onClick={() => toggleBookmark(mark.s, mark.a)}
                      className="grid h-11 w-11 shrink-0 place-items-center text-gold"
                    >
                      <Bookmark className="size-5" fill="currentColor" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        ) : null}

        <p className="pt-2 text-center text-xs text-faint">نص المصحف برواية حفص عن عاصم</p>
      </main>
      <PlayerDock />
      <SettingsSheet open={settings} onClose={() => setSettings(false)} />
    </div>
  );
}

function SurahList({ items }: { items: ReturnType<typeof filterSurahs> }) {
  return (
    <div className="flex flex-col">
      {items.map((surah) => (
        <Link
          key={surah.i}
          to="/read/$surah"
          params={{ surah: String(surah.i) }}
          search={{ a: 1 }}
          className="flex min-h-16 items-center gap-3 border-b border-line py-3"
        >
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-line text-sm font-medium text-gold">
            {toArabicDigits(surah.i)}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-lg font-semibold leading-tight">{surah.ar}</span>
            <span className="block text-sm text-muted">
              {placeLabel(surah.place)} · {toArabicDigits(surah.n)} آيات
            </span>
          </span>
        </Link>
      ))}
    </div>
  );
}

function Mark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 2.2 14.1 9.9 21.8 12 14.1 14.1 12 21.8 9.9 14.1 2.2 12 9.9 9.9Z"
      />
    </svg>
  );
}
