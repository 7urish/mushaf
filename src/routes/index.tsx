import { createFileRoute } from "@tanstack/react-router";
import { HomeView } from "@/components/quran/home-view";

export const Route = createFileRoute("/")({
  component: HomeView,
  head: () => ({
    meta: [{ title: "المصحف" }],
  }),
});
