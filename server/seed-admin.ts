import bcrypt from "bcryptjs";
import { db } from "./db";
import { users } from "@shared/models/auth";
import { userProfiles } from "@shared/schema";
import { eq, or } from "drizzle-orm";

async function ensureAdmin(email: string, phone: string | null, password: string, firstName: string, lastName: string) {
  const conditions = [eq(users.email, email)];
  if (phone) conditions.push(eq(users.phone, phone));

  const existing = await db.select().from(users).where(
    conditions.length === 1 ? conditions[0] : or(...conditions)
  );

  if (existing.length > 0) {
    const profile = await db.select().from(userProfiles).where(eq(userProfiles.userId, existing[0].id));
    if (profile.length > 0 && profile[0].role === "admin" && profile[0].onboardingCompleted) {
      return;
    }
    if (profile.length > 0) {
      await db.update(userProfiles).set({ role: "admin", onboardingCompleted: true, firstName, lastName }).where(eq(userProfiles.userId, existing[0].id));
    } else {
      await db.insert(userProfiles).values({
        userId: existing[0].id,
        firstName,
        lastName,
        role: "admin",
        onboardingCompleted: true,
      });
    }
    await db.update(users).set({ email, phone: phone || undefined, firstName, lastName }).where(eq(users.id, existing[0].id));
    console.log(`Admin updated: ${email}`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const [user] = await db
    .insert(users)
    .values({ email, phone, passwordHash, firstName, lastName })
    .returning();

  await db.insert(userProfiles).values({
    userId: user.id,
    firstName,
    lastName,
    role: "admin",
    onboardingCompleted: true,
  });

  console.log(`Admin seeded: ${email}`);
}

export async function seedAdmin() {
  try {
    await ensureAdmin("admin@gaslite.co.za", null, "Admin123!", "Admin", "Gaslite");
    await ensureAdmin("malcolm@movedigital.africa", "0834654639", "Admin123!", "Malcolm", "Govender");
  } catch (error) {
    console.error("Failed to seed admin accounts:", error);
  }
}
