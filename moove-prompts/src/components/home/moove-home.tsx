import Link from "next/link";
import { unstable_cache } from "next/cache";
import { getTranslations } from "next-intl/server";
import { ArrowRight, ArrowUpRight, Bot, Copy, LogIn, Plus, Search, Sparkles, Wand2 } from "lucide-react";
import { db } from "@/lib/db";
import { getPromptUrl } from "@/lib/urls";
import { Button } from "@/components/ui/button";
import { HomeSearch } from "./home-search";

const PUBLIC_PROMPT = { isPrivate: false, isUnlisted: false, deletedAt: null } as const;

const promptSelect = {
  id: true,
  slug: true,
  title: true,
  description: true,
  content: true,
  type: true,
  createdAt: true,
  viewCount: true,
  author: { select: { username: true, name: true, avatar: true } },
  category: { select: { name: true, slug: true, icon: true } },
  _count: { select: { votes: true } },
} as const;

const getHomeData = unstable_cache(
  async () => {
    const [promptCount, skillCount, tagCount, categoriesRaw, latest, loved, skills] = await Promise.all([
      db.prompt.count({ where: PUBLIC_PROMPT }),
      db.prompt.count({ where: { ...PUBLIC_PROMPT, type: "SKILL" } }),
      db.tag.count(),
      db.category.findMany({
        select: {
          id: true,
          name: true,
          slug: true,
          icon: true,
          _count: { select: { prompts: { where: PUBLIC_PROMPT } } },
        },
      }),
      db.prompt.findMany({ where: PUBLIC_PROMPT, orderBy: { createdAt: "desc" }, take: 6, select: promptSelect }),
      db.prompt.findMany({
        where: PUBLIC_PROMPT,
        orderBy: [{ votes: { _count: "desc" } }, { viewCount: "desc" }],
        take: 6,
        select: promptSelect,
      }),
      db.prompt.findMany({
        where: { ...PUBLIC_PROMPT, type: "SKILL" },
        orderBy: [{ votes: { _count: "desc" } }, { viewCount: "desc" }],
        take: 3,
        select: promptSelect,
      }),
    ]);

    const categories = categoriesRaw
      .filter((c) => c._count.prompts > 0)
      .sort((a, b) => b._count.prompts - a._count.prompts)
      .slice(0, 8);

    return { promptCount, skillCount, tagCount, categoryCount: categoriesRaw.length, categories, latest, loved, skills };
  },
  ["v2", "moove-home"],
  { tags: ["prompts", "categories", "tags"], revalidate: 300 }
);

type HomePrompt = Awaited<ReturnType<typeof getHomeData>>["latest"][number];

const TYPE_STYLES: Record<string, string> = {
  TEXT: "bg-primary/10 text-primary",
  IMAGE: "bg-brand-accent/20 text-brand-accent-foreground dark:text-brand-accent",
  VIDEO: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  AUDIO: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  STRUCTURED: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  SKILL: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  TASTE: "bg-pink-500/10 text-pink-600 dark:text-pink-400",
};

function formatCount(n: number): string {
  return new Intl.NumberFormat("en-US").format(n);
}

function excerpt(prompt: HomePrompt): string {
  const source = prompt.description?.trim() || prompt.content;
  const clean = source.replace(/\s+/g, " ").trim();
  return clean.length > 150 ? `${clean.slice(0, 150)}…` : clean;
}

function TypeBadge({ type }: { type: string }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${TYPE_STYLES[type] ?? TYPE_STYLES.TEXT}`}>
      {type.toLowerCase()}
    </span>
  );
}

function PromptRow({ prompt, index }: { prompt: HomePrompt; index: number }) {
  return (
    <li>
      <Link
        href={getPromptUrl(prompt.id, prompt.slug)}
        className="group flex gap-4 rounded-[var(--radius)] border border-transparent px-3 py-3 transition-colors hover:border-border hover:bg-card"
      >
        <span className="w-7 shrink-0 pt-0.5 font-mono text-sm tabular-nums text-muted-foreground/70">
          {String(index + 1).padStart(2, "0")}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-base font-semibold group-hover:text-primary">{prompt.title}</h3>
            <TypeBadge type={prompt.type} />
          </div>
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{excerpt(prompt)}</p>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            {prompt.category && (
              <span className="inline-flex items-center gap-1">
                {prompt.category.icon && <span aria-hidden="true">{prompt.category.icon}</span>}
                {prompt.category.name}
              </span>
            )}
            <span>@{prompt.author.username}</span>
            <span>▲ {formatCount(prompt._count.votes)}</span>
          </div>
        </div>
        <ArrowUpRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" aria-hidden="true" />
      </Link>
    </li>
  );
}

function PromptTile({ prompt }: { prompt: HomePrompt }) {
  return (
    <Link href={getPromptUrl(prompt.id, prompt.slug)} className="moove-card flex flex-col p-5">
      <div className="flex items-center justify-between gap-2">
        <TypeBadge type={prompt.type} />
        <span className="text-xs text-muted-foreground">▲ {formatCount(prompt._count.votes)}</span>
      </div>
      <h3 className="mt-3 text-lg font-semibold leading-snug">{prompt.title}</h3>
      <p className="mt-2 line-clamp-3 font-mono text-[13px] leading-relaxed text-muted-foreground">{excerpt(prompt)}</p>
      <div className="mt-4 flex items-center justify-between border-t pt-3 text-xs text-muted-foreground">
        <span>@{prompt.author.username}</span>
        {prompt.category && <span>{prompt.category.name}</span>}
      </div>
    </Link>
  );
}

interface MooveHomeProps {
  isLoggedIn: boolean;
  showRegisterButton: boolean;
  isOAuth: boolean;
}

export async function MooveHome({ isLoggedIn, showRegisterButton, isOAuth }: MooveHomeProps) {
  const t = await getTranslations("moove");
  const data = await getHomeData();

  const stats = [
    { label: t("stats.prompts"), value: data.promptCount },
    { label: t("stats.skills"), value: data.skillCount },
    { label: t("stats.categories"), value: data.categoryCount },
    { label: t("stats.tags"), value: data.tagCount },
  ];

  const steps = [
    { icon: Search, title: t("how.step1Title"), body: t("how.step1Body") },
    { icon: Wand2, title: t("how.step2Title"), body: t("how.step2Body") },
    { icon: Bot, title: t("how.step3Title"), body: t("how.step3Body") },
  ];

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden border-b">
        <div className="moove-glow absolute inset-0" aria-hidden="true" />
        <div className="moove-dots absolute inset-0 opacity-40 [mask-image:radial-gradient(70%_60%_at_50%_0%,black,transparent)]" aria-hidden="true" />
        <div className="container relative py-16 md:py-24">
          <div className="max-w-3xl">
            <span className="moove-eyebrow">{t("hero.eyebrow")}</span>
            <h1 className="mt-5 text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl md:text-6xl">
              {t("hero.titleLead")}{" "}
              <span className="bg-gradient-to-r from-primary to-brand-accent bg-clip-text text-transparent">{t("hero.titleAccent")}</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">{t("hero.description")}</p>
          </div>
          <div className="mt-10">
            <HomeSearch />
          </div>
          <dl className="mt-12 grid max-w-3xl grid-cols-2 gap-px overflow-hidden rounded-[var(--radius)] border bg-border sm:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="bg-card/80 px-5 py-4 backdrop-blur">
                <dt className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{s.label}</dt>
                <dd className="mt-1 font-heading text-2xl font-bold tabular-nums md:text-3xl">{formatCount(s.value)}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Categories */}
      <section className="container py-14 md:py-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="moove-eyebrow">{t("categories.eyebrow")}</span>
            <h2 className="mt-3 text-2xl font-bold md:text-3xl">{t("categories.title")}</h2>
          </div>
          <Link href="/categories" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
            {t("categories.all")} <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
        <ul className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {data.categories.map((c) => (
            <li key={c.id}>
              <Link href={`/categories/${c.slug}`} className="moove-card flex h-full items-center gap-3 p-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-lg" aria-hidden="true">
                  {c.icon || c.name.charAt(0)}
                </span>
                <span className="min-w-0">
                  <span className="block truncate font-semibold">{c.name}</span>
                  <span className="block text-xs text-muted-foreground">{t("categories.count", { count: c._count.prompts })}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* Latest + Most loved */}
      <section className="border-y bg-card/40">
        <div className="container grid gap-12 py-14 md:py-20 lg:grid-cols-2 lg:gap-16">
          <div>
            <span className="moove-eyebrow">{t("latest.eyebrow")}</span>
            <h2 className="mt-3 text-2xl font-bold md:text-3xl">{t("latest.title")}</h2>
            <ol className="mt-6 -mx-3 space-y-1">
              {data.latest.map((p, i) => (
                <PromptRow key={p.id} prompt={p} index={i} />
              ))}
            </ol>
            <Link href="/prompts?sort=newest" className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
              {t("latest.all")} <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
          <div>
            <span className="moove-eyebrow">{t("loved.eyebrow")}</span>
            <h2 className="mt-3 text-2xl font-bold md:text-3xl">{t("loved.title")}</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {data.loved.map((p) => (
                <PromptTile key={p.id} prompt={p} />
              ))}
            </div>
            <Link href="/prompts?sort=popular" className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
              {t("loved.all")} <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="container py-14 md:py-20">
        <div className="max-w-2xl">
          <span className="moove-eyebrow">{t("how.eyebrow")}</span>
          <h2 className="mt-3 text-2xl font-bold md:text-3xl">{t("how.title")}</h2>
          <p className="mt-3 text-muted-foreground">{t("how.description")}</p>
        </div>
        <ol className="mt-10 grid gap-6 md:grid-cols-3">
          {steps.map((step, i) => (
            <li key={step.title} className="relative rounded-[var(--radius)] border bg-card p-6">
              <span className="absolute right-5 top-4 font-mono text-4xl font-bold text-muted-foreground/15">{String(i + 1).padStart(2, "0")}</span>
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                <step.icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <h3 className="mt-5 text-lg font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Skills */}
      {data.skills.length > 0 && (
        <section className="border-t bg-card/40">
          <div className="container py-14 md:py-20">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <span className="moove-eyebrow">{t("skills.eyebrow")}</span>
                <h2 className="mt-3 text-2xl font-bold md:text-3xl">{t("skills.title")}</h2>
                <p className="mt-3 max-w-2xl text-muted-foreground">{t("skills.description")}</p>
              </div>
              <Link href="/skills" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
                {t("skills.all")} <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {data.skills.map((p) => (
                <PromptTile key={p.id} prompt={p} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="container py-14 md:py-20">
        <div className="relative overflow-hidden rounded-[calc(var(--radius)*2)] border bg-gradient-to-br from-primary/15 via-card to-brand-accent/15 p-8 md:p-12">
          <Sparkles className="absolute right-8 top-8 h-10 w-10 text-primary/30" aria-hidden="true" />
          <div className="max-w-2xl">
            <h2 className="text-2xl font-bold md:text-3xl">{t("cta.title")}</h2>
            <p className="mt-3 text-muted-foreground">{t("cta.description")}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button size="lg" asChild>
                <Link href={isLoggedIn ? "/prompts/new" : isOAuth ? "/login" : "/register"}>
                  <Plus className="mr-1.5 h-4 w-4" aria-hidden="true" />
                  {t("cta.primary")}
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/prompts">
                  <Copy className="mr-1.5 h-4 w-4" aria-hidden="true" />
                  {t("cta.secondary")}
                </Link>
              </Button>
              {showRegisterButton && (
                <Button size="lg" variant="ghost" asChild>
                  <Link href={isOAuth ? "/login" : "/register"}>
                    <LogIn className="mr-1.5 h-4 w-4" aria-hidden="true" />
                    {t("cta.signIn")}
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
