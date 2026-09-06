import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { auth } from "@/lib/auth";

// Cache tags used by the cached listing pages and APIs.
const TAGS = ["prompts", "categories", "tags", "connections", "leaderboard", "prompt-flow"] as const;

/**
 * Admin-only: purge the cached listing data (prompts, categories, tags, ...).
 * Use after importing or seeding prompts outside the app (e.g. `npm run db:seed`),
 * since those paths never trigger Next.js revalidation on their own.
 */
async function handle() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  for (const tag of TAGS) {
    revalidateTag(tag, "max");
  }

  return NextResponse.json({ revalidated: TAGS, at: new Date().toISOString() });
}

export const GET = handle;
export const POST = handle;
