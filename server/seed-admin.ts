import bcrypt from "bcryptjs";
import { db } from "./db";
import { users } from "@shared/models/auth";
import { userProfiles } from "@shared/schema";
import { eq } from "drizzle-orm";

export async function seedAdmin() {
  const adminEmail = "admin@gaslite.co.za";
  const adminPassword = "Admin123!";

  try {
    const existing = await db.select().from(users).where(eq(users.email, adminEmail));
    if (existing.length > 0) {
      const profile = await db.select().from(userProfiles).where(eq(userProfiles.userId, existing[0].id));
      if (profile.length > 0 && profile[0].role === "admin") {
        return;
      }
      if (profile.length > 0) {
        await db.update(userProfiles).set({ role: "admin" }).where(eq(userProfiles.userId, existing[0].id));
        console.log("Admin role updated for existing user");
        return;
      }
      await db.insert(userProfiles).values({
        userId: existing[0].id,
        firstName: "Admin",
        lastName: "Gaslite",
        role: "admin",
      });
      console.log("Admin profile created for existing user");
      return;
    }

    const passwordHash = await bcrypt.hash(adminPassword, 12);
    const [user] = await db
      .insert(users)
      .values({
        email: adminEmail,
        passwordHash,
        firstName: "Admin",
        lastName: "Gaslite",
      })
      .returning();

    await db.insert(userProfiles).values({
      userId: user.id,
      firstName: "Admin",
      lastName: "Gaslite",
      role: "admin",
    });

    console.log("Admin account seeded successfully");
  } catch (error) {
    console.error("Failed to seed admin account:", error);
  }
}
