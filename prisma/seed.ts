import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create default admin user with password "1234"
  const hashedPassword = await bcrypt.hash("1234", 10);

  const adminUser = await prisma.user.upsert({
    where: { email: "admin@calclone.com" },
    update: {},
    create: {
      email: "admin@calclone.com",
      username: "admin",
      password: hashedPassword,
      name: "Admin User",
      timezone: "America/New_York",
    },
  });

  console.log("✅ Created admin user:", {
    email: adminUser.email,
    username: adminUser.username,
    password: "1234 (default)",
  });

  // Create default availability for admin (Mon-Fri 9AM-5PM)
  await prisma.availability.createMany({
    data: [
      {
        userId: adminUser.id,
        days: [1, 2, 3, 4, 5], // Monday to Friday
        startTime: "09:00",
        endTime: "17:00",
      },
    ],
  });

  console.log("✅ Created default availability (Mon-Fri 9AM-5PM)");

  // Create sample event type
  const eventType = await prisma.eventType.upsert({
    where: {
      userId_slug: {
        userId: adminUser.id,
        slug: "30min-meeting",
      },
    },
    update: {},
    create: {
      userId: adminUser.id,
      title: "30 Minute Meeting",
      slug: "30min-meeting",
      duration: 30,
      description: "A quick 30-minute meeting to discuss your needs.",
      color: "#3b82f6",
      minimumBookingNotice: 60, // 1 hour notice
      beforeEventBuffer: 0,
      afterEventBuffer: 0,
    },
  });

  console.log("✅ Created sample event type:", eventType.title);

  console.log("\n🎉 Database seeded successfully!");
  console.log("\n📝 Login credentials:");
  console.log("   Email: admin@calclone.com");
  console.log("   Password: 1234");
  console.log("   Booking URL: http://localhost:3000/admin");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ Error seeding database:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
