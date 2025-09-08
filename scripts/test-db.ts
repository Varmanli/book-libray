import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.create({
    data: {
      email: "test@example.com",
      name: "Tester",
    },
  });

  console.log("Created user:", user);

  const allUsers = await prisma.user.findMany();
  console.log("All users:", allUsers);
}

main().finally(() => prisma.$disconnect());
