import { useEffect, useState } from "react";
import { loadText } from "@/lib/quran";

export function useQuranText() {
  const [text, setText] = useState<string[][] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let live = true;
    setError(null);
    loadText()
      .then((value) => {
        if (live) setText(value);
      })
      .catch((err: unknown) => {
        if (!live) return;
        setError(err instanceof Error ? err.message : "تعذّر تحميل نص المصحف");
      });
    return () => {
      live = false;
    };
  }, [attempt]);

  return { text, error, retry: () => setAttempt((n) => n + 1) };
}
