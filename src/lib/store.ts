import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useEffect, useState } from "react";

export type ThemeName = "night" | "day";

export type Bookmark = { s: number; a: number; t: number };

type MushafState = {
  theme: ThemeName;
  fontSize: number;
  reciter: string;
  rate: number;
  showPages: boolean;
  follow: boolean;
  autoNextSurah: boolean;
  repeat: boolean;
  last: { s: number; a: number } | null;
  bookmarks: Bookmark[];
  setTheme: (theme: ThemeName) => void;
  setFontSize: (size: number) => void;
  setReciter: (id: string) => void;
  setRate: (rate: number) => void;
  cycleRate: () => void;
  togglePages: () => void;
  toggleFollow: () => void;
  toggleAutoNext: () => void;
  toggleRepeat: () => void;
  setLast: (s: number, a: number) => void;
  toggleBookmark: (s: number, a: number) => void;
};

const RATES = [0.75, 1, 1.25, 1.5];

export const useMushaf = create<MushafState>()(
  persist(
    (set, get) => ({
      theme: "night",
      fontSize: 34,
      reciter: "ar.mahermuaiqly",
      rate: 1,
      showPages: true,
      follow: true,
      autoNextSurah: true,
      repeat: false,
      last: null,
      bookmarks: [],
      setTheme: (theme) => set({ theme }),
      setFontSize: (size) => set({ fontSize: Math.min(56, Math.max(24, size)) }),
      setReciter: (reciter) => set({ reciter }),
      setRate: (rate) => set({ rate }),
      cycleRate: () => {
        const current = get().rate;
        const index = RATES.indexOf(current);
        set({ rate: RATES[(index + 1) % RATES.length] ?? 1 });
      },
      togglePages: () => set({ showPages: !get().showPages }),
      toggleFollow: () => set({ follow: !get().follow }),
      toggleAutoNext: () => set({ autoNextSurah: !get().autoNextSurah }),
      toggleRepeat: () => set({ repeat: !get().repeat }),
      setLast: (s, a) => set({ last: { s, a } }),
      toggleBookmark: (s, a) => {
        const current = get().bookmarks;
        const index = current.findIndex((item) => item.s === s && item.a === a);
        if (index >= 0) {
          set({ bookmarks: current.filter((_, i) => i !== index) });
          return;
        }
        set({ bookmarks: [{ s, a, t: Date.now() }, ...current].slice(0, 300) });
      },
    }),
    { name: "mushaf", version: 1 },
  ),
);

export function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    setHydrated(useMushaf.persist.hasHydrated());
    return useMushaf.persist.onFinishHydration(() => setHydrated(true));
  }, []);
  return hydrated;
}

export function useApplyTheme() {
  const theme = useMushaf((state) => state.theme);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute(
      "content",
      theme === "day" ? "#f3ecdf" : "#0e1411",
    );
  }, [theme]);
}
