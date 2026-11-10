import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { ChevronRight, Minus, Plus, Settings } from "lucide-react";
import {
  BISMILLAH,
  globalIndex,
  isSajda,
  juzOf,
  pageOf,
  placeLabel,
  surahById,
  toArabicDigits,
  fromArabicDigits,
  pageStart,
  locate,
} from "@/lib/quran";
import { useMushaf } from "@/lib/store";
import { useQuranText } from "@/lib/use-text";
import { PlayerDock, useAudio } from "@/components/quran/audio";
import { SettingsSheet, Sheet } from "@/components/quran/settings";

export function ReaderView({ surah, ayah }: { surah: number; ayah: number }) {
  const meta = surahById(surah);
  const { text, error, retry } = useQuranText();
  const audio = useAudio();
  const fontSize = useMushaf((state) => state.fontSize);
  const setFontSize = useMushaf((state) => state.setFontSize);
  const showPages = useMushaf((state) => state.showPages);
  const follow = useMushaf((state) => state.follow);
  const setLast = useMushaf((state) => state.setLast);
  const toggleBookmark = useMushaf((state) => state.toggleBookmark);
  const [sel, setSel] = useState(ayah);
  const [visible, setVisible] = useState(ayah);
  const [settings, setSettings] = useState(false);
  const [jumpOpen, setJumpOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const bookmarked = useMushaf((state) => state.bookmarks.some((item) => item.s === surah && item.a === sel));
  const verses = text?.[surah - 1];
  const visibleGlobal = meta ? globalIndex(surah, Math.min(visible, meta.n)) : 0;

  useEffect(() => {
    setSel(ayah);
    setVisible(ayah);
    setLast(surah, ayah);
  }, [surah, ayah, setLast]);

  useEffect(() => {
    if (!verses) return;
    const target = document.getElementById(`ayah-${surah}-${ayah}`);
    if (ayah <= 1) {
      window.scrollTo({ top: 0 });
      return;
    }
    target?.scrollIntoView({ block: "center" });
  }, [verses, surah, ayah]);

  useEffect(() => {
    if (audio.playing && audio.current?.s === surah) setSel(audio.current.a);
  }, [audio.playing, audio.current, surah]);

  useEffect(() => {
    if (!follow || !audio.playing || audio.current?.s !== surah) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.getElementById(`ayah-${surah}-${audio.current.a}`)?.scrollIntoView({
      block: "center",
      behavior: reduce ? "auto" : "smooth",
    });
  }, [audio.current, audio.playing, follow, surah]);

  useEffect(() => {
    if (!verses) return;
    const nodes = document.querySelectorAll<HTMLElement>("[data-ayah-row]");
    const observer = new IntersectionObserver(
      (entries) => {
        const top = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        const next = Number((top?.target as HTMLElement | undefined)?.dataset.ayah);
        if (next) setVisible(next);
      },
      { rootMargin: "-96px 0px -62% 0px", threshold: 0.15 },
    );
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [verses, surah]);

  useEffect(() => {
    const timer = window.setTimeout(() => setLast(surah, visible), 800);
    return () => window.clearTimeout(timer);
  }, [surah, visible, setLast]);

  async function copyAyah() {
    const verse = verses?.[sel - 1];
    if (!verse || !meta) return;
    const payload = `${verse} ﴿${toArabicDigits(sel)}﴾ — ${meta.ar}`;
    try {
      await navigator.clipboard.writeText(payload);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      setCopied(false);
    }
  }

  if (!meta) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p>هذه السورة غير موجودة.</p>
        <Link to="/" className="mt-4 inline-block text-gold">
          العودة إلى الفهرس
        </Link>
      </main>
    );
  }

  const clamped = Math.min(Math.max(sel, 1), meta.n);

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-30 border-b border-line bg-bg/95 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center gap-1 px-2 py-2">
          <Link to="/" aria-label="الفهرس" className="grid h-11 w-11 place-items-center">
            <ChevronRight className="size-6" />
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-base font-semibold">سورة {meta.ar}</h1>
            <button type="button" onClick={() => setJumpOpen(true)} className="text-xs text-muted">
              الصفحة {toArabicDigits(pageOf(visibleGlobal))} · الجزء {toArabicDigits(juzOf(visibleGlobal))}
            </button>
          </div>
          <button type="button" aria-label="تصغير الخط" onClick={() => setFontSize(fontSize - 2)} className="grid h-11 w-11 place-items-center">
            <Minus className="size-4" />
          </button>
          <button type="button" aria-label="تكبير الخط" onClick={() => setFontSize(fontSize + 2)} className="grid h-11 w-11 place-items-center">
            <Plus className="size-4" />
          </button>
          <button type="button" aria-label="الإعدادات" onClick={() => setSettings(true)} className="grid h-11 w-11 place-items-center">
            <Settings className="size-5" />
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl px-3 pt-6 pb-44">
        <div className="mb-6 text-center">
          <p className="text-xs tracking-wide text-gold">سورة</p>
          <h2 className="mt-1 text-3xl font-semibold">{meta.ar}</h2>
          <p className="mt-1 text-sm text-muted">
            {placeLabel(meta.place)} · {toArabicDigits(meta.n)} آيات
          </p>
        </div>

        {meta.bismillah ? <p className="basmala mb-6 text-center text-3xl text-gold">{BISMILLAH}</p> : null}

        {error ? (
          <div className="rounded-xl border border-line px-4 py-4 text-center text-sm">
            <p>{error}</p>
            <button type="button" onClick={retry} className="mt-3 text-gold">
              إعادة المحاولة
            </button>
          </div>
        ) : null}

        {!verses && !error ? <p className="text-center text-sm text-muted">جاري فتح السورة…</p> : null}

        <div style={{ fontSize }}>
          {verses?.map((verse, index) => {
            const n = index + 1;
            const g = globalIndex(surah, n);
            const page = pageOf(g);
            const juz = juzOf(g);
            const prevG = n === 1 ? g : g - 1;
            const pageBreak = showPages && n > 1 && page !== pageOf(prevG);
            const juzBreak = showPages && n > 1 && juz !== juzOf(prevG);
            const playing = audio.playing && audio.current?.s === surah && audio.current.a === n;
            return (
              <div key={n}>
                {pageBreak || juzBreak ? (
                  <div className="my-4 flex items-center gap-3 text-xs text-faint">
                    <span className="h-px flex-1 bg-line" />
                    <span>
                      {juzBreak ? `الجزء ${toArabicDigits(juz)} · ` : ""}
                      الصفحة {toArabicDigits(page)}
                    </span>
                    <span className="h-px flex-1 bg-line" />
                  </div>
                ) : null}
                <div
                  id={`ayah-${surah}-${n}`}
                  data-ayah-row
                  data-ayah={n}
                  data-active={clamped === n}
                  data-playing={playing}
                  className="ayah-block"
                  onClick={() => {
                    setSel(n);
                    setLast(surah, n);
                    if (audio.playing) audio.play(surah, n);
                  }}
                >
                  <p className="quran-text text-fg">
                    {verse}
                    <button
                      type="button"
                      className="ayah-mark"
                      aria-label={`تشغيل الآية ${toArabicDigits(n)}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        setSel(n);
                        audio.play(surah, n);
                      }}
                    >
                      {toArabicDigits(n)}
                    </button>
                  </p>
                  {isSajda(surah, n) ? <p className="mt-1 text-xs text-gold">سجدة</p> : null}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 grid grid-cols-2 gap-2">
          {surah > 1 ? (
            <Link
              to="/read/$surah"
              params={{ surah: String(surah - 1) }}
              search={{ a: 1 }}
              className="min-h-12 rounded-xl border border-line px-3 py-3 text-center text-sm"
            >
              السورة السابقة
            </Link>
          ) : (
            <span />
          )}
          {surah < 114 ? (
            <Link
              to="/read/$surah"
              params={{ surah: String(surah + 1) }}
              search={{ a: 1 }}
              className="min-h-12 rounded-xl border border-line px-3 py-3 text-center text-sm"
            >
              السورة التالية
            </Link>
          ) : null}
        </div>
      </main>

      <PlayerDock
        surah={surah}
        ayah={clamped}
        bookmarked={bookmarked}
        copied={copied}
        onToggleBookmark={() => toggleBookmark(surah, clamped)}
        onCopy={() => void copyAyah()}
      />
      <SettingsSheet open={settings} onClose={() => setSettings(false)} />
      <JumpSheet
        open={jumpOpen}
        onClose={() => setJumpOpen(false)}
        surah={surah}
        maxAyah={meta.n}
      />
    </div>
  );
}

function JumpSheet({
  open,
  onClose,
  surah,
  maxAyah,
}: {
  open: boolean;
  onClose: () => void;
  surah: number;
  maxAyah: number;
}) {
  const [page, setPage] = useState("");
  const [ayah, setAyah] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return;
    setPage("");
    setAyah("");
    setMessage("");
  }, [open]);

  return (
    <Sheet open={open} title="انتقال" onClose={onClose}>
      <form
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          const ayahNo = Number(fromArabicDigits(ayah));
          const pageNo = Number(fromArabicDigits(page));
          if (ayah && (ayahNo < 1 || ayahNo > maxAyah)) {
            setMessage(`أدخل آية بين ١ و${toArabicDigits(maxAyah)}`);
            return;
          }
          if (!ayah && (pageNo < 1 || pageNo > 604)) {
            setMessage("أدخل صفحة بين ١ و٦٠٤");
            return;
          }
          if (ayah) {
            void navigate({
              to: "/read/$surah",
              params: { surah: String(surah) },
              search: { a: ayahNo },
            });
            onClose();
            return;
          }
          const loc = locate(pageStart[pageNo - 1] ?? 0);
          void navigate({
            to: "/read/$surah",
            params: { surah: String(loc.s) },
            search: { a: loc.a },
          });
          onClose();
        }}
      >
        <label className="block text-sm">
          <span className="mb-1 block text-muted">آية في هذه السورة</span>
          <input
            inputMode="numeric"
            value={ayah}
            onChange={(event) => setAyah(event.target.value)}
            placeholder={`١ – ${toArabicDigits(maxAyah)}`}
            className="h-12 w-full rounded-xl border border-line bg-bg px-3 text-fg outline-none"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-muted">أو رقم صفحة المصحف</span>
          <input
            inputMode="numeric"
            value={page}
            onChange={(event) => setPage(event.target.value)}
            placeholder="١ – ٦٠٤"
            className="h-12 w-full rounded-xl border border-line bg-bg px-3 text-fg outline-none"
          />
        </label>
        {message ? <p className="text-sm text-gold">{message}</p> : null}
        <button type="submit" className="min-h-12 rounded-xl bg-gold-fill text-sm font-semibold text-on-gold">
          انتقل
        </button>
      </form>
    </Sheet>
  );
}
