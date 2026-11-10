import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { Bookmark, ChevronLeft, ChevronRight, Pause, Play, Repeat } from "lucide-react";
import {
  audioUrl,
  formatRate,
  globalIndex,
  locate,
  reciterName,
  surahById,
  totalAyahs,
  toArabicDigits,
  type Pos,
} from "@/lib/quran";
import { useMushaf } from "@/lib/store";

type AudioApi = {
  current: Pos | null;
  playing: boolean;
  error: string | null;
  play: (s: number, a: number) => void;
  toggle: () => void;
  next: () => void;
  prev: () => void;
  stop: () => void;
};

const AudioContext = createContext<AudioApi | null>(null);

export function useAudio(): AudioApi {
  const ctx = useContext(AudioContext);
  if (!ctx) throw new Error("مشغّل التلاوة غير جاهز");
  return ctx;
}

export function QuranAudioProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const [current, setCurrent] = useState<Pos | null>(null);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentRef = useRef<Pos | null>(null);
  const navigateRef = useRef(navigate);
  const routeSurahRef = useRef<number | null>(null);
  const playRef = useRef<(s: number, a: number) => void>(() => {});

  currentRef.current = current;
  navigateRef.current = navigate;
  routeSurahRef.current = Number(pathname.match(/\/read\/(\d+)/)?.[1] ?? "") || null;

  const play = useCallback((s: number, a: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    const surah = surahById(s);
    if (!surah || a < 1 || a > surah.n) return;
    const { reciter, rate, setLast } = useMushaf.getState();
    const url = audioUrl(reciter, globalIndex(s, a) + 1);
    setError(null);
    setCurrent({ s, a });
    setLast(s, a);
    if (routeSurahRef.current && routeSurahRef.current !== s) {
      void navigateRef.current({
        to: "/read/$surah",
        params: { surah: String(s) },
        search: { a },
        replace: true,
      });
    }
    audio.src = url;
    audio.playbackRate = rate;
    void audio.play().then(
      () => setPlaying(true),
      () => {
        setPlaying(false);
        setError("تعذّر بدء التلاوة. حاول مرة أخرى.");
      },
    );
  }, []);

  playRef.current = play;

  const step = useCallback((dir: 1 | -1, manual: boolean) => {
    const cur = currentRef.current;
    if (!cur) return;
    const g = globalIndex(cur.s, cur.a) + dir;
    if (g < 0 || g >= totalAyahs) {
      audioRef.current?.pause();
      setPlaying(false);
      return;
    }
    const loc = locate(g);
    if (!manual && dir === 1 && loc.s !== cur.s && !useMushaf.getState().autoNextSurah) {
      audioRef.current?.pause();
      setPlaying(false);
      return;
    }
    playRef.current(loc.s, loc.a);
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onEnded = () => {
      if (useMushaf.getState().repeat) {
        audio.currentTime = 0;
        void audio.play().then(
          () => setPlaying(true),
          () => setPlaying(false),
        );
        return;
      }
      step(1, false);
    };
    const onError = () => {
      if (!audio.getAttribute("src")) return;
      setPlaying(false);
      setError("تعذّر تحميل صوت هذه الآية.");
    };
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("error", onError);
    return () => {
      audio.pause();
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("error", onError);
    };
  }, [step]);

  const reciter = useMushaf((state) => state.reciter);
  const rate = useMushaf((state) => state.rate);

  useEffect(() => {
    const audio = audioRef.current;
    const cur = currentRef.current;
    if (!audio || !cur) return;
    audio.playbackRate = rate;
    const url = audioUrl(reciter, globalIndex(cur.s, cur.a) + 1);
    if (audio.src.endsWith(`/${globalIndex(cur.s, cur.a) + 1}.mp3`) && audio.src.includes(reciter)) {
      return;
    }
    const wasPlaying = !audio.paused;
    audio.src = url;
    if (wasPlaying) {
      void audio.play().catch(() => setPlaying(false));
    }
  }, [reciter, rate]);

  const toggle = useCallback(() => {
    const audio = audioRef.current;
    const cur = currentRef.current;
    if (!audio || !cur) return;
    if (!audio.paused) {
      audio.pause();
      setPlaying(false);
      return;
    }
    void audio.play().then(
      () => setPlaying(true),
      () => {
        setPlaying(false);
        setError("اضغط تشغيل مرة أخرى.");
      },
    );
  }, []);

  const stop = useCallback(() => {
    audioRef.current?.pause();
    setPlaying(false);
  }, []);

  const api = useMemo<AudioApi>(
    () => ({
      current,
      playing,
      error,
      play,
      toggle,
      next: () => step(1, true),
      prev: () => step(-1, true),
      stop,
    }),
    [current, playing, error, play, toggle, step, stop],
  );

  return (
    <AudioContext.Provider value={api}>
      <audio ref={audioRef} preload="none" className="sr-audio" />
      {children}
    </AudioContext.Provider>
  );
}

type DockProps = {
  surah?: number;
  ayah?: number;
  bookmarked?: boolean;
  copied?: boolean;
  onToggleBookmark?: () => void;
  onCopy?: () => void;
};

export function PlayerDock({ surah, ayah, bookmarked, copied, onToggleBookmark, onCopy }: DockProps) {
  const audio = useAudio();
  const reciter = useMushaf((state) => state.reciter);
  const rate = useMushaf((state) => state.rate);
  const repeat = useMushaf((state) => state.repeat);
  const cycleRate = useMushaf((state) => state.cycleRate);
  const toggleRepeat = useMushaf((state) => state.toggleRepeat);

  const target: Pos | null =
    surah && ayah ? { s: surah, a: ayah } : audio.current;
  if (!target) return null;

  const meta = surahById(target.s);
  const isCurrent =
    audio.current?.s === target.s && audio.current?.a === target.a && Boolean(audio.current);
  const showFull = Boolean(surah && ayah);

  function playTarget() {
    if (!target) return;
    if (isCurrent) audio.toggle();
    else audio.play(target.s, target.a);
  }

  function go(dir: 1 | -1) {
    const base = isCurrent && audio.current ? audio.current : target;
    if (!base) return;
    const g = globalIndex(base.s, base.a) + dir;
    if (g < 0 || g >= totalAyahs) return;
    const loc = locate(g);
    audio.play(loc.s, loc.a);
  }

  return (
    <div className="dock fixed inset-x-0 bottom-0 z-40 border-t border-line bg-bg/95 backdrop-blur">
      <div className="mx-auto flex max-w-2xl flex-col gap-2 px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">
              {meta?.ar} · الآية {toArabicDigits(target.a)}
            </p>
            <p className="truncate text-xs text-muted">{reciterName(reciter)}</p>
          </div>
          {showFull ? (
            <div className="flex shrink-0 items-center gap-1">
              <IconButton label={bookmarked ? "إزالة المحفوظ" : "حفظ الآية"} onClick={onToggleBookmark}>
                <Bookmark className="size-5" fill={bookmarked ? "currentColor" : "none"} />
              </IconButton>
              <IconButton label={copied ? "نُسخت" : "نسخ الآية"} onClick={onCopy}>
                <span className="text-xs font-semibold">{copied ? "تم" : "نسخ"}</span>
              </IconButton>
            </div>
          ) : null}
        </div>
        {audio.error ? <p className="text-xs text-gold">{audio.error}</p> : null}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <IconButton label="الآية السابقة" onClick={() => (isCurrent ? audio.prev() : go(-1))}>
              <ChevronRight className="size-6" />
            </IconButton>
            <button
              type="button"
              onClick={playTarget}
              aria-label={audio.playing && isCurrent ? "إيقاف" : "تشغيل"}
              className="grid h-12 w-12 place-items-center rounded-full bg-gold-fill text-on-gold"
            >
              {audio.playing && isCurrent ? <Pause className="size-5" /> : <Play className="size-5" />}
            </button>
            <IconButton label="الآية التالية" onClick={() => (isCurrent ? audio.next() : go(1))}>
              <ChevronLeft className="size-6" />
            </IconButton>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-pressed={repeat}
              onClick={toggleRepeat}
              className={
                "grid h-11 min-w-11 place-items-center rounded-full border border-line px-2 " +
                (repeat ? "text-gold" : "text-muted")
              }
            >
              <Repeat className="size-4" />
              <span className="sr-only">تكرار الآية</span>
            </button>
            <button
              type="button"
              onClick={cycleRate}
              className="h-11 min-w-14 rounded-full border border-line px-3 text-sm text-fg"
            >
              {formatRate(rate)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function IconButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick?: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="grid h-11 min-w-11 place-items-center rounded-full text-fg"
    >
      {children}
    </button>
  );
}
