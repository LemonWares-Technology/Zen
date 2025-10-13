import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed...");

  // Create admin user
  const admin = await prisma.admin.upsert({
    where: { email: "admin@zen.com" },
    update: {},
    create: {
      email: "admin@zen.com",
      firstName: "Admin",
      lastName: "User",
      isActive: true,
    },
  });

  console.log("✅ Admin user created:", admin);

  // Create a sample user
  const user = await prisma.user.upsert({
    where: { email: "user@zen.com" },
    update: {},
    create: {
      email: "user@zen.com",
      firstName: "John",
      lastName: "Doe",
      role: "USER",
      isActive: true,
      isVerified: true,
    },
  });

  console.log("✅ Sample user created:", user);

  console.log("🎉 Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
