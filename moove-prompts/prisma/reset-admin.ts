import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🔐 Resetting admin user...");

  const adminEmail = (process.env.ADMIN_EMAIL || "admin@prompts.chat").trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || "password123";
  const password = await bcrypt.hash(adminPassword, 12);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      password: password,
      role: "ADMIN",
    },
    create: {
      email: adminEmail,
      username: "admin",
      name: "Admin User",
      password: password,
      role: "ADMIN",
      locale: "en",
    },
  });

  console.log("✅ Admin user reset successfully!");
  console.log("\n📋 Credentials:");
  console.log(`   Email:    ${adminEmail}`);
  console.log(process.env.ADMIN_PASSWORD ? "   Password: (from ADMIN_PASSWORD)" : "   Password: password123");
}

main()
  .catch((e) => {
    console.error("❌ Failed to reset admin:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
