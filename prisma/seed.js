const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const CATEGORIES = [
  {
    category_name: 'Cars',
    subcategories: [
      'Sale',
      'Purchase',
      'Advertise',
      'Commercial rentals',
      'Accessories',
      'Showroom contact details',
      'Brokers (transfer, inspection teams, documentation, tax payments)',
    ],
  },
  {
    category_name: 'Property',
    subcategories: [
      'Sale',
      'Purchase',
      'Rent',
      'Advertise (on buildings)',
      'Documentation and property office details',
      'Transfers and other related procedures',
    ],
  },
  {
    category_name: 'Travel',
    subcategories: ['Hotels'],
  },
  {
    category_name: 'Electronics & appliances',
    subcategories: [
      'Computers & laptops',
      'Cameras & accessories',
      'TVs & entertainment',
      'Kitchen appliances',
      'Cooling & heating',
      'Other home appliances',
    ],
  },
  {
    category_name: 'Mobiles & tablets',
    subcategories: [
      'Smartphones',
      'Tablets',
      'Smartwatches',
      'Phone accessories',
      'Landline & cordless phones',
      'SIMs & mobile numbers',
    ],
  },
  {
    category_name: 'Bikes & two-wheelers',
    subcategories: [
      'Motorbikes',
      'Bicycles',
      'Scooters',
      'Spare parts & accessories',
      'ATVs & quads',
      'Servicing & repair',
    ],
  },
  {
    category_name: 'Jobs & careers',
    subcategories: [
      'Full-time positions',
      'Part-time & freelance',
      'Hospitality staff',
      'Education & tutoring',
      'Domestic staff',
      'Delivery & driving',
      'Skilled trades',
    ],
  },
  {
    category_name: 'Business & industrial',
    subcategories: [
      'Machinery & equipment',
      'Construction tools',
      'Agriculture supplies',
      'Wholesale & trade',
      'Businesses for sale',
    ],
  },
  {
    category_name: 'Services',
    subcategories: [
      'Home repair & maintenance',
      'Events & catering',
      'Tutoring & consultancy',
      'Legal & documentation help',
      'Beauty & wellness',
      'Equipment rentals',
    ],
  },
  {
    category_name: 'Fashion & beauty',
    subcategories: [
      'Clothing',
      'Footwear',
      'Bags & accessories',
      'Watches & jewelry',
      'Beauty & personal care',
    ],
  },
  {
    category_name: 'Furniture & home',
    subcategories: [
      'Beds & wardrobes',
      'Sofas & seating',
      'Dining & tables',
      'Home decor',
      'Kitchen & bath essentials',
      'Garden & outdoor',
    ],
  },
  {
    category_name: 'Animals, hobbies & kids',
    subcategories: [
      'Pets & adoption',
      'Livestock & birds',
      'Sports & fitness gear',
      'Books & instruments',
      'Toys & kids gear',
    ],
  },
];

async function main() {
  await prisma.subcategory.deleteMany({});
  await prisma.category.deleteMany({});

  for (const item of CATEGORIES) {
    await prisma.category.create({
      data: {
        category_name: item.category_name,
        subcategories: {
          create: item.subcategories.map((subcategory_name) => ({ subcategory_name })),
        },
      },
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
