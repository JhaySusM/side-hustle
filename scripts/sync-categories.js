const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const wanted = [
  'Mobiles',
  'Vehicles',
  'Property For Rent',
  'Clothes',
  'Property',
  'Service',
  'Food',
  'Furniture',
  'Books',
  'Sports',
  'Toys',
  'Tools',
];

async function main() {
  const electronics = await prisma.category.findUnique({ where: { category_name: 'Electronics' } });
  const mobiles = await prisma.category.findUnique({ where: { category_name: 'Mobiles' } });

  if (electronics && !mobiles) {
    await prisma.category.update({
      where: { id: electronics.id },
      data: { category_name: 'Mobiles' },
    });
  } else if (electronics && mobiles) {
    await prisma.productList.updateMany({
      where: { category_table_id: electronics.id },
      data: { category_table_id: mobiles.id },
    });
    await prisma.category.delete({ where: { id: electronics.id } });
  }

  const fashion = await prisma.category.findUnique({ where: { category_name: 'Fashion' } });
  const clothes = await prisma.category.findUnique({ where: { category_name: 'Clothes' } });

  if (fashion && !clothes) {
    await prisma.category.update({
      where: { id: fashion.id },
      data: { category_name: 'Clothes' },
    });
  } else if (fashion && clothes) {
    await prisma.productList.updateMany({
      where: { category_table_id: fashion.id },
      data: { category_table_id: clothes.id },
    });
    await prisma.category.delete({ where: { id: fashion.id } });
  }

  for (const name of wanted) {
    await prisma.category.upsert({
      where: { category_name: name },
      update: {},
      create: { category_name: name },
    });
  }

  const categories = await prisma.category.findMany({
    orderBy: { category_name: 'asc' },
    include: { _count: { select: { products: true } } },
  });

  console.log(JSON.stringify(categories));
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
