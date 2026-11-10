import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";
import { RECITERS, toArabicDigits } from "@/lib/quran";
import { useMushaf, type ThemeName } from "@/lib/store";

export function Sheet({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button type="button" aria-label="إغلاق" className="scrim absolute inset-0" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative z-10 max-h-[86vh] w-full max-w-2xl overflow-y-auto rounded-t-2xl border border-line bg-surface px-5 pt-4 pb-8 sm:rounded-2xl"
      >
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold">{title}</h2>
          <button type="button" aria-label="إغلاق" onClick={onClose} className="grid h-11 w-11 place-items-center">
            <X className="size-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function SettingsSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const theme = useMushaf((state) => state.theme);
  const fontSize = useMushaf((state) => state.fontSize);
  const reciter = useMushaf((state) => state.reciter);
  const showPages = useMushaf((state) => state.showPages);
  const follow = useMushaf((state) => state.follow);
  const autoNextSurah = useMushaf((state) => state.autoNextSurah);
  const setTheme = useMushaf((state) => state.setTheme);
  const setFontSize = useMushaf((state) => state.setFontSize);
  const setReciter = useMushaf((state) => state.setReciter);
  const togglePages = useMushaf((state) => state.togglePages);
  const toggleFollow = useMushaf((state) => state.toggleFollow);
  const toggleAutoNext = useMushaf((state) => state.toggleAutoNext);

  return (
    <Sheet open={open} title="إعدادات القراءة" onClose={onClose}>
      <p className="mb-2 text-sm text-muted">المظهر</p>
      <div className="mb-5 grid grid-cols-2 gap-2">
        <Choice on={theme === "night"} onClick={() => setTheme("night" satisfies ThemeName)}>
          ليلي
        </Choice>
        <Choice on={theme === "day"} onClick={() => setTheme("day")}>
          نهاري
        </Choice>
      </div>

      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium">حجم الخط</p>
          <p className="basmala text-gold" style={{ fontSize }}>
            بِسۡمِ ٱللَّهِ
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Round onClick={() => setFontSize(fontSize - 2)} label="تصغير الخط">
            −
          </Round>
          <span className="w-8 text-center text-sm">{toArabicDigits(fontSize)}</span>
          <Round onClick={() => setFontSize(fontSize + 2)} label="تكبير الخط">
            +
          </Round>
        </div>
      </div>

      <p className="mb-2 text-sm text-muted">القارئ</p>
      <div className="mb-4 overflow-hidden rounded-xl border border-line">
        {RECITERS.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-pressed={reciter === item.id}
            onClick={() => setReciter(item.id)}
            className={
              "flex min-h-11 w-full items-center justify-between border-b border-line px-3 py-2 text-start last:border-b-0 " +
              (reciter === item.id ? "bg-surface-2 text-gold" : "")
            }
          >
            <span className="text-sm">{item.name}</span>
            {reciter === item.id ? <span className="text-xs">مختار</span> : null}
          </button>
        ))}
      </div>

      <Toggle label="فواصل الصفحات" hint="إظهار رقم الصفحة والجزء أثناء القراءة" on={showPages} onToggle={togglePages} />
      <Toggle label="متابعة التمرير" hint="تحريك الصفحة مع الآية الجارية" on={follow} onToggle={toggleFollow} />
      <Toggle
        label="السورة التالية"
        hint="متابعة التلاوة عند انتهاء السورة"
        on={autoNextSurah}
        onToggle={toggleAutoNext}
      />
    </Sheet>
  );
}

function Choice({ on, onClick, children }: { on: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={
        "min-h-11 rounded-xl border px-3 text-sm font-medium " +
        (on ? "border-gold bg-gold-fill text-on-gold" : "border-line bg-bg text-fg")
      }
    >
      {children}
    </button>
  );
}

function Round({ onClick, label, children }: { onClick: () => void; label: string; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="grid h-11 w-11 place-items-center rounded-full border border-line text-lg"
    >
      {children}
    </button>
  );
}

function Toggle({
  label,
  hint,
  on,
  onToggle,
}: {
  label: string;
  hint: string;
  on: boolean;
  onToggle: () => void;
}) {
  return (
    <button type="button" aria-pressed={on} onClick={onToggle} className="flex w-full items-center justify-between gap-4 py-3 text-start">
      <span>
        <span className="block text-sm font-medium">{label}</span>
        <span className="block text-xs text-muted">{hint}</span>
      </span>
      <span
        className={
          "shrink-0 rounded-full px-3 py-1 text-xs font-medium " +
          (on ? "bg-gold-fill text-on-gold" : "bg-surface-2 text-muted")
        }
      >
        {on ? "يعمل" : "متوقف"}
      </span>
    </button>
  );
}
