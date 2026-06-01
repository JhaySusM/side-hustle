const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const categories = [
    'Electronics',
    'Vehicles',
    'Furniture',
    'Fashion',
    'Sports',
    'Books',
    'Music',
    'Gaming',
  ];

  for (const name of categories) {
    await prisma.category.upsert({
      where: { category_name: name },
      update: {},
      create: { category_name: name },
    });
  }

  console.log('Categories seeded!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
