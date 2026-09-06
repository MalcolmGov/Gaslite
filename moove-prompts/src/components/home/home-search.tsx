"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowRight, Search } from "lucide-react";

const QUICK_SEARCHES = ["email", "landing page", "SEO", "code review", "social media", "proposal"];

export function HomeSearch() {
  const t = useTranslations("moove.hero");
  const router = useRouter();
  const [query, setQuery] = useState("");

  const go = (q: string) => {
    const value = q.trim();
    router.push(value ? `/prompts?q=${encodeURIComponent(value)}` : "/prompts");
  };

  return (
    <div className="w-full max-w-2xl">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          go(query);
        }}
        className="group relative flex items-center rounded-full border-2 border-border bg-card p-1.5 pl-5 shadow-lg shadow-primary/5 transition-colors focus-within:border-primary"
      >
        <Search className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("searchPlaceholder")}
          aria-label={t("searchPlaceholder")}
          className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-base outline-none placeholder:text-muted-foreground"
        />
        <button
          type="submit"
          className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          {t("searchButton")}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </form>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span>{t("tryLabel")}</span>
        {QUICK_SEARCHES.map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => go(q)}
            className="rounded-full border bg-background px-2.5 py-1 font-medium text-foreground/80 transition-colors hover:border-primary hover:text-primary"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}
