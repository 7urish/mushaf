import textUrl from "@/data/text.json?url";
import { juz, pageStart, sajda, surahOffset, surahs, totalAyahs, type SurahMeta } from "@/data/meta";

export type Pos = { s: number; a: number };
export type AyahHit = { s: number; a: number; text: string };

export { juz, pageStart, surahs, totalAyahs, type SurahMeta };

export const BISMILLAH = "بِسۡمِ ٱللَّهِ ٱلرَّحۡمَٰنِ ٱلرَّحِيمِ";

export const RECITERS = [
  { id: "ar.mahermuaiqly", name: "ماهر المعيقلي", bitrate: 128 },
  { id: "ar.abdurrahmaansudais", name: "عبد الرحمن السديس", bitrate: 64 },
  { id: "ar.saoodshuraym", name: "سعود الشريم", bitrate: 64 },
  { id: "ar.hudhaify", name: "علي الحذيفي", bitrate: 128 },
  { id: "ar.alafasy", name: "مشاري العفاسي", bitrate: 128 },
  { id: "ar.shaatree", name: "أبو بكر الشاطري", bitrate: 128 },
  { id: "ar.minshawi", name: "محمد صديق المنشاوي", bitrate: 128 },
  { id: "ar.husary", name: "محمود خليل الحصري", bitrate: 128 },
  { id: "ar.abdulbasitmurattal", name: "عبد الباسط عبد الصمد", bitrate: 64 },
] as const;

export const RATES = [0.75, 1, 1.25, 1.5] as const;

const sajdaKeys = new Set(sajda.map(([s, a]) => s * 1000 + a));
const juzGlobal = juz.map((j) => surahOffset[j.s - 1] + (j.a - 1));

export function toArabicDigits(n: number): string {
  return String(n).replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[Number(d)]);
}

export function fromArabicDigits(value: string): string {
  return value.replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
}

export function normalizeArabic(input: string): string {
  return input
    .replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED\u08D3-\u08FF\u0640]/g, "")
    .replace(/[\u200B-\u200F\u202A-\u202E\u2060\uFEFF]/g, "")
    .replace(/[أإآٱ\u0671]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/\s+/g, " ")
    .trim();
}

export function placeLabel(place: SurahMeta["place"]): string {
  return place === "makkah" ? "مكية" : "مدنية";
}

export function globalIndex(s: number, a: number): number {
  return surahOffset[s - 1] + (a - 1);
}

export function locate(g: number): Pos {
  let lo = 0;
  let hi = surahs.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const start = surahOffset[mid];
    const end = start + surahs[mid].n;
    if (g < start) hi = mid - 1;
    else if (g >= end) lo = mid + 1;
    else return { s: surahs[mid].i, a: g - start + 1 };
  }
  return { s: 114, a: surahs[113].n };
}

export function pageOf(g: number): number {
  let lo = 0;
  let hi = pageStart.length - 1;
  let ans = 0;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (pageStart[mid] <= g) {
      ans = mid;
      lo = mid + 1;
    } else hi = mid - 1;
  }
  return ans + 1;
}

export function juzOf(g: number): number {
  let ans = 1;
  for (let i = 0; i < juzGlobal.length; i++) {
    if (juzGlobal[i] <= g) ans = i + 1;
    else break;
  }
  return ans;
}

export function isSajda(s: number, a: number): boolean {
  return sajdaKeys.has(s * 1000 + a);
}

export function audioUrl(reciterId: string, globalOne: number): string {
  const reciter = RECITERS.find((item) => item.id === reciterId) ?? RECITERS[0];
  return `https://cdn.islamic.network/quran/audio/${reciter.bitrate}/${reciter.id}/${globalOne}.mp3`;
}

export function reciterName(id: string): string {
  return RECITERS.find((item) => item.id === id)?.name ?? RECITERS[0].name;
}

export function formatRate(rate: number): string {
  const labels: Record<string, string> = {
    "0.75": "٠٫٧٥×",
    "1": "١×",
    "1.25": "١٫٢٥×",
    "1.5": "١٫٥×",
  };
  return labels[String(rate)] ?? `${rate}×`;
}

export function surahById(id: number): SurahMeta | undefined {
  return surahs[id - 1];
}

function stripDefinite(value: string): string {
  return value.replace(/^ال/, "");
}

export function filterSurahs(query: string): SurahMeta[] {
  const raw = fromArabicDigits(query).trim();
  if (!raw) return surahs;
  const arabic = normalizeArabic(raw).replace(/\s/g, "");
  const latin = raw.toLowerCase().replace(/['’\-]/g, "");
  const digits = /^\d+$/.test(raw) ? Number(raw) : null;
  return surahs.filter((surah) => {
    if (digits !== null && (surah.i === digits || String(surah.i).startsWith(raw))) return true;
    const name = normalizeArabic(surah.ar).replace(/\s/g, "");
    if (arabic && (name.includes(arabic) || stripDefinite(name).includes(stripDefinite(arabic)))) {
      return true;
    }
    if (latin.length >= 2 && surah.en.toLowerCase().replace(/['’\-]/g, "").includes(latin)) return true;
    return false;
  });
}

let normCache: string[][] | null = null;

function indexText(text: string[][]) {
  normCache = text.map((surah) => surah.map((ayah) => normalizeArabic(ayah).replace(/\s/g, "")));
}

const SEARCH_SKIP = new Set(["ايه", "سوره", "جزء"]);

export function searchAyahs(text: string[][], query: string, limit = 40): AyahHit[] {
  const words = normalizeArabic(query)
    .split(" ")
    .map((word) => word.replace(/^ال(?=.{3,})/, ""))
    .filter((word) => word.length >= 2 && !SEARCH_SKIP.has(word));
  if (!words.length) return [];
  if (!normCache || normCache.length !== text.length) indexText(text);
  const hits: AyahHit[] = [];
  const cache = normCache;
  if (!cache) return hits;
  for (let s = 0; s < cache.length; s++) {
    const surah = cache[s];
    for (let a = 0; a < surah.length; a++) {
      if (!words.every((word) => surah[a].includes(word))) continue;
      hits.push({ s: s + 1, a: a + 1, text: text[s][a] });
      if (hits.length >= limit) return hits;
    }
  }
  return hits;
}

let textPromise: Promise<string[][]> | null = null;

export function loadText(): Promise<string[][]> {
  if (!textPromise) {
    const pending = fetch(textUrl).then(async (res) => {
      if (!res.ok) throw new Error("تعذّر تحميل نص المصحف");
      const data = (await res.json()) as string[][];
      if (!Array.isArray(data) || data.length !== 114) throw new Error("نص المصحف غير مكتمل");
      indexText(data);
      return data;
    });
    textPromise = pending;
    pending.catch(() => {
      if (textPromise === pending) textPromise = null;
    });
  }
  return textPromise;
}
