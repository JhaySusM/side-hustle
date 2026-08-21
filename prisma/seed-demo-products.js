// One-off manual script to populate the marketplace with demo listings —
// 5 per category, assigned to a random existing active user. Not wired into
// `prisma db seed`; run manually with `node prisma/seed-demo-products.js`.
//
// Images are real, hand-verified photos (Unsplash / Wikimedia Commons direct
// CDN links, researched per listing) — not keyword-matched placeholders, so
// each one genuinely matches its product.
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const DEMO_PRODUCTS = {
  Cars: [
    { title: "Toyota Corolla 2018 - Automatic", price: 3200000, subcategory: "Sale", description: "Well-maintained Corolla Altis, first owner, full option, accident free. Genuine 60,000 km on the clock.", image: "https://upload.wikimedia.org/wikipedia/commons/0/0f/Toyota_Corolla_Sedan.jpg" },
    { title: "Honda Civic 2019 - Oriel", price: 4650000, subcategory: "Sale", description: "Civic Oriel 1.8, bank leased ended, all original documents in hand. Serious buyers only.", image: "https://images.unsplash.com/photo-1561823528-057f4774dd3e" },
    { title: "Suzuki Alto 2021 - VXL", price: 2450000, subcategory: "Sale", description: "Low mileage Alto VXL, single owner, still under manufacturer warranty. Bumper to bumper insured.", image: "https://upload.wikimedia.org/wikipedia/commons/4/47/Suzuki_ALTO_S_%28HA36S%29_right_%28cropped%29.JPG" },
    { title: "Toyota Hilux Revo 2020", price: 8900000, subcategory: "Sale", description: "Revo G 4x4, diesel automatic, company maintained with complete service history.", image: "https://upload.wikimedia.org/wikipedia/commons/a/a5/2017_Toyota_Hilux_Revo_Smart-Cab_2.4J_Plus.jpg" },
    { title: "KIA Sportage 2022 - AWD", price: 7300000, subcategory: "Sale", description: "Top-of-the-line Sportage AWD, sunroof, leather interior, under warranty till 2027.", image: "https://upload.wikimedia.org/wikipedia/commons/0/0f/Kia_Sportage_%28NQ5%29_IMG_6277.jpg" },
  ],
  Property: [
    { title: "5 Marla House for Sale - DHA Phase 5", price: 28500000, subcategory: "Sale", description: "Brand new construction, 3 bed attached bath, modern kitchen, corner plot in a gated community.", image: "https://images.unsplash.com/photo-1613490493576-7fde63acd811" },
    { title: "10 Marla Plot for Sale - Bahria Town", price: 19500000, subcategory: "Sale", description: "Prime location plot, possession ready, all dues cleared, ideal for immediate construction.", image: "https://images.unsplash.com/photo-1587745890135-20db8c79b027" },
    { title: "2 Bed Apartment for Rent - Gulberg", price: 85000, subcategory: "Rent", description: "Fully furnished 2 bedroom apartment, lift, backup generator, walking distance to main market.", image: "https://images.unsplash.com/photo-1768638687896-35bde623d532" },
    { title: "Commercial Shop for Rent - Main Boulevard", price: 150000, subcategory: "Rent", description: "Ground floor shop on main boulevard, high foot traffic, suitable for retail or franchise.", image: "https://images.unsplash.com/photo-1464869372688-a93d806be852" },
    { title: "1 Kanal House for Sale - Model Town", price: 65000000, subcategory: "Sale", description: "Spacious family home with lawn and servant quarters, quiet street, close to parks.", image: "https://images.unsplash.com/photo-1505843513577-22bb7d21e455" },
  ],
  Travel: [
    { title: "Deluxe Room - Hunza Serena Inn", price: 22000, subcategory: "Hotels", description: "Mountain view deluxe room, breakfast included, walking distance to Baltit Fort.", image: "https://images.unsplash.com/photo-1611892440504-42a792e24d32" },
    { title: "Family Suite - Murree Hill View Hotel", price: 18500, subcategory: "Hotels", description: "Spacious family suite sleeping 4, valley view balcony, close to Mall Road.", image: "https://images.unsplash.com/photo-1673687782286-674e29c9bf9e" },
    { title: "Budget Room - Naran Continental", price: 8500, subcategory: "Hotels", description: "Clean budget-friendly room, hot water, parking available, near river view point.", image: "https://images.unsplash.com/photo-1520014384091-f75776a1ca4f" },
    { title: "Beachfront Room - Karachi Seaview Hotel", price: 16000, subcategory: "Hotels", description: "Sea-facing room with balcony, pool access, minutes from Clifton beach.", image: "https://images.unsplash.com/photo-1644417520671-ae8ecc3064ce" },
    { title: "Mountain Cabin - Swat Valley Resort", price: 25000, subcategory: "Hotels", description: "Wooden cabin surrounded by pine trees, bonfire on request, scenic valley views.", image: "https://images.unsplash.com/photo-1737112227544-0b5b3ef51719" },
  ],
  "Electronics & appliances": [
    { title: "Dell XPS 13 Laptop - Core i7", price: 285000, subcategory: "Computers & laptops", description: "16GB RAM, 512GB SSD, barely used, comes with original charger and box.", image: "https://images.unsplash.com/photo-1593642532744-d377ab507dc8" },
    { title: "Samsung 55\" 4K Smart TV", price: 165000, subcategory: "TVs & entertainment", description: "Crystal UHD smart TV, wall mount included, 1 year old, excellent picture quality.", image: "https://images.unsplash.com/photo-1697457053997-555dfc117cf1" },
    { title: "LG Front Load Washing Machine", price: 98000, subcategory: "Other home appliances", description: "8kg capacity, inverter direct drive motor, energy efficient, minor cosmetic wear.", image: "https://images.unsplash.com/photo-1630699144306-e5af29b5c236" },
    { title: "Canon EOS 200D DSLR Camera", price: 135000, subcategory: "Cameras & accessories", description: "With 18-55mm kit lens, low shutter count, includes camera bag and extra battery.", image: "https://images.unsplash.com/photo-1499696786230-3ebd9d0d6fd8" },
    { title: "Haier 1.5 Ton Inverter AC", price: 145000, subcategory: "Cooling & heating", description: "DC inverter, energy saving, installation kit included, 2 years old, well maintained.", image: "https://images.unsplash.com/photo-1762341123870-d706f257a12e" },
  ],
  "Mobiles & tablets": [
    { title: "iPhone 13 Pro Max 256GB", price: 285000, subcategory: "Smartphones", description: "PTA approved, battery health 92%, no scratches, box and accessories included.", image: "https://images.unsplash.com/photo-1644571669401-9ab344866592" },
    { title: "Samsung Galaxy S22 Ultra", price: 195000, subcategory: "Smartphones", description: "12GB/256GB variant, S Pen included, screen protector on since day one.", image: "https://images.unsplash.com/photo-1707438095977-2a8b9d1af3e5" },
    { title: "iPad Air 5th Gen", price: 145000, subcategory: "Tablets", description: "Wi-Fi 64GB, space grey, comes with Apple Pencil 2nd gen and folio case.", image: "https://images.unsplash.com/photo-1759820941220-fed6a1010146" },
    { title: "Xiaomi Redmi Note 12", price: 42000, subcategory: "Smartphones", description: "8GB/128GB, dual sim, PTA approved, used for 4 months, like new condition.", image: "https://upload.wikimedia.org/wikipedia/commons/2/2b/Redmi_Note_12_Turbo_with_a_business_card_to_show_the_size_of_the_phone.jpg" },
    { title: "Apple Watch Series 8", price: 89000, subcategory: "Smartwatches", description: "45mm GPS version, extra sport bands included, minor scratches on the back.", image: "https://images.unsplash.com/photo-1544277904-e5f402acf987" },
  ],
  "Bikes & two-wheelers": [
    { title: "Honda CD 70 2022", price: 145000, subcategory: "Motorbikes", description: "Genuine 5,000 km, first owner, all original parts, file ready for transfer.", image: "https://upload.wikimedia.org/wikipedia/commons/3/3b/Honda_cd_70.jpg" },
    { title: "Yamaha YBR 125", price: 245000, subcategory: "Motorbikes", description: "Well maintained, new tyres, recently serviced, smooth engine and clutch.", image: "https://upload.wikimedia.org/wikipedia/commons/8/82/YBR125.JPG" },
    { title: "Road Bicycle - Trek FX2", price: 65000, subcategory: "Bicycles", description: "Hybrid road bike, 21 gears, lightly used, ideal for city commuting.", image: "https://upload.wikimedia.org/wikipedia/commons/4/4f/SN_EN_14764_Trek_FX_7_3.jpg" },
    { title: "Suzuki GS 150", price: 285000, subcategory: "Motorbikes", description: "Fresh import condition, all documents clear, no accident history.", image: "https://upload.wikimedia.org/wikipedia/commons/4/49/Suzuki_GS_150_Touring.jpg" },
    { title: "Electric Scooter - Jolta", price: 175000, subcategory: "Scooters", description: "Fully electric, 60km range per charge, charger included, 6 months old.", image: "https://upload.wikimedia.org/wikipedia/commons/b/b8/Gogoro_1_Plus_Blue.jpg" },
  ],
  "Jobs & careers": [
    { title: "Female Receptionist Needed - Lahore", price: 35000, subcategory: "Full-time positions", description: "Front desk role, good communication skills required, timings 9am-6pm, six days a week.", image: "https://upload.wikimedia.org/wikipedia/commons/b/b0/Female_Hotel_Receptionist.jpg" },
    { title: "Delivery Rider - Full Time", price: 40000, subcategory: "Delivery & driving", description: "Own motorbike required, fuel allowance provided, flexible shifts available.", image: "https://images.unsplash.com/photo-1779583350228-566db01e9049" },
    { title: "Content Writer - Remote/Freelance", price: 30000, subcategory: "Part-time & freelance", description: "Native English writing skills, SEO knowledge a plus, pay per article available.", image: "https://images.unsplash.com/photo-1758612214882-03f8a1d7211f" },
    { title: "Home Tutor for Matric Students", price: 25000, subcategory: "Education & tutoring", description: "Math and Physics tutor needed for O-Level student, evenings preferred.", image: "https://images.unsplash.com/photo-1583468991267-3f068b607ae1" },
    { title: "Site Supervisor - Construction", price: 65000, subcategory: "Skilled trades", description: "Minimum 3 years experience on residential projects, must be based in Lahore.", image: "https://images.unsplash.com/photo-1591588582259-e675bd2e6088" },
  ],
  "Business & industrial": [
    { title: "Generac 10kVA Generator", price: 385000, subcategory: "Machinery & equipment", description: "Diesel generator, low running hours, well maintained, ideal for commercial backup.", image: "https://images.unsplash.com/photo-1705051278299-7e64ba21437a" },
    { title: "Used Sewing Machines (Industrial) - Lot of 5", price: 175000, subcategory: "Machinery & equipment", description: "Juki industrial machines, working condition, suitable for garment stitching unit.", image: "https://upload.wikimedia.org/wikipedia/commons/9/95/A_sewing_studio_at_CBCC_and_CIHE.jpg" },
    { title: "Forklift for Rent - 3 Ton", price: 55000, subcategory: "Construction tools", description: "Daily and monthly rental available, operator can be provided on request.", image: "https://images.unsplash.com/photo-1714627798569-b3e36d409c4b" },
    { title: "Wholesale Rice Supply - 50kg Bags", price: 18500, subcategory: "Wholesale & trade", description: "Basmati rice, direct from mill, bulk order discounts available.", image: "https://upload.wikimedia.org/wikipedia/commons/4/43/Rice_sacks.jpg" },
    { title: "Small Grocery Business for Sale", price: 950000, subcategory: "Businesses for sale", description: "Running grocery store with steady customer base, includes fixtures and inventory.", image: "https://images.unsplash.com/photo-1759197894183-ffffa3c7fcd4" },
  ],
  Services: [
    { title: "AC Repair & Installation Service", price: 3500, subcategory: "Home repair & maintenance", description: "Same day service, gas refill, general servicing and new unit installation.", image: "https://images.unsplash.com/photo-1642749776312-aa42ce20c9f5" },
    { title: "Wedding Catering Services", price: 1500, subcategory: "Events & catering", description: "Per head pricing for full course wedding menu, staff and setup included.", image: "https://upload.wikimedia.org/wikipedia/commons/6/61/A_some_foods_at_buffet_table_in_Holiday_Inn_Golden_Mile_Hong_Kong.jpg" },
    { title: "Home Tutoring - O/A Levels", price: 4000, subcategory: "Tutoring & consultancy", description: "Experienced tutor for Cambridge O/A Level Sciences, per session rate.", image: "https://images.unsplash.com/photo-1758685733907-42e9651721f5" },
    { title: "Legal Documentation & NOC Assistance", price: 8000, subcategory: "Legal & documentation help", description: "Property transfer, NOC processing and affidavit drafting handled professionally.", image: "https://images.unsplash.com/photo-1583521214690-73421a1829a9" },
    { title: "Bridal Makeup Artist", price: 25000, subcategory: "Beauty & wellness", description: "HD bridal makeup package including hairstyling and trial session.", image: "https://images.unsplash.com/photo-1638628064365-f08ad0ec8245" },
  ],
  "Fashion & beauty": [
    { title: "Men's Formal Blazer - Size L", price: 6500, subcategory: "Clothing", description: "Slim fit navy blazer, worn twice, dry cleaned, like new condition.", image: "https://images.unsplash.com/photo-1592343516109-362f7bd871aa" },
    { title: "Women's Lawn Suit (3-Piece)", price: 4200, subcategory: "Clothing", description: "Unstitched premium lawn print, includes dupatta, brand new with tags.", image: "https://images.unsplash.com/photo-1743229995505-d6374996df1c" },
    { title: "Leather Handbag - Genuine Leather", price: 8900, subcategory: "Bags & accessories", description: "Imported genuine leather handbag, barely used, comes with dust bag.", image: "https://images.unsplash.com/photo-1598532163257-ae3c6b2524b6" },
    { title: "Rolex Style Wrist Watch", price: 5500, subcategory: "Watches & jewelry", description: "Automatic movement, stainless steel strap, gift box included.", image: "https://images.unsplash.com/photo-1600003014755-ba31aa59c4b6" },
    { title: "Organic Skincare Set", price: 3200, subcategory: "Beauty & personal care", description: "Face wash, serum and moisturizer set, unopened, sealed packaging.", image: "https://images.unsplash.com/photo-1630398777649-cdfc7c5e8a24" },
  ],
  "Furniture & home": [
    { title: "Wooden Bed Set with Side Tables", price: 65000, subcategory: "Beds & wardrobes", description: "Solid sheesham wood king size bed with two matching side tables.", image: "https://images.unsplash.com/photo-1517912191359-67659f8690a2" },
    { title: "L-Shaped Sofa - 6 Seater", price: 85000, subcategory: "Sofas & seating", description: "Fabric L-shape sofa, minimal wear, very comfortable, pet-free smoke-free home.", image: "https://images.unsplash.com/photo-1759722668253-1767030ad9b2" },
    { title: "Dining Table - 6 Chairs", price: 48000, subcategory: "Dining & tables", description: "Solid wood dining set, seats 6 comfortably, minor scratches on tabletop.", image: "https://images.unsplash.com/photo-1758977403341-0104135995af" },
    { title: "Wall Art & Home Decor Pieces", price: 4500, subcategory: "Home decor", description: "Set of 3 canvas wall art pieces, modern design, ready to hang.", image: "https://images.unsplash.com/photo-1769117549887-d7ab37279060" },
    { title: "Outdoor Garden Bench", price: 15500, subcategory: "Garden & outdoor", description: "Weather-resistant wooden bench, seats 2-3, great for lawn or patio.", image: "https://upload.wikimedia.org/wikipedia/commons/8/85/Garden_bench_001.jpg" },
  ],
  "Animals, hobbies & kids": [
    { title: "Persian Cat Kittens for Adoption", price: 12000, subcategory: "Pets & adoption", description: "8-week-old vaccinated Persian kittens, litter trained, very playful.", image: "https://upload.wikimedia.org/wikipedia/commons/d/d4/%27Doll_Faced_pure_white_persian_kitten%2824_days_old%29.JPG" },
    { title: "Aseel Hens - Pair", price: 9500, subcategory: "Livestock & birds", description: "Healthy breeding pair, good lineage, raised in a clean home environment.", image: "https://upload.wikimedia.org/wikipedia/commons/6/6b/Asil_rooster%2C_also_known_as_Aseel.jpg" },
    { title: "Treadmill - Home Gym Equipment", price: 55000, subcategory: "Sports & fitness gear", description: "Motorized treadmill, incline feature, lightly used, works perfectly.", image: "https://images.unsplash.com/photo-1649068618811-9f3547ef98fc" },
    { title: "Guitar - Acoustic, Beginner Friendly", price: 8500, subcategory: "Books & instruments", description: "40-inch acoustic guitar, includes bag and extra strings, great for beginners.", image: "https://images.unsplash.com/photo-1630110330918-ced8a801add8" },
    { title: "Kids Bicycle - Age 5-8", price: 9500, subcategory: "Toys & kids gear", description: "16-inch wheel bicycle with training wheels, lightly used, good condition.", image: "https://images.unsplash.com/photo-1766021736547-0fca7e6cdf9f" },
  ],
};

function pickRandom(list) {
  return list[Math.floor(Math.random() * list.length)];
}

async function main() {
  const categories = await prisma.category.findMany({ include: { subcategories: true } });
  const users = await prisma.user.findMany({ where: { status: "active" }, select: { id: true } });

  if (!users.length) {
    throw new Error("No active users found — cannot assign demo listings to anyone.");
  }

  const createdIds = [];

  for (const category of categories) {
    const items = DEMO_PRODUCTS[category.category_name];
    if (!items) {
      console.warn(`No demo data defined for category "${category.category_name}", skipping.`);
      continue;
    }

    for (const item of items) {
      const owner = pickRandom(users);
      const subcategory =
        category.subcategories.find((sub) => sub.subcategory_name === item.subcategory) ||
        pickRandom(category.subcategories) ||
        null;

      const product = await prisma.productList.create({
        data: {
          product_name: item.title,
          price: item.price,
          description: item.description,
          image: item.image,
          images: null,
          product_status: "Active",
          category_table_id: category.id,
          subcategory_table_id: subcategory ? subcategory.id : null,
          user_id: owner.id,
          upload_date_time: new Date(),
        },
      });

      createdIds.push(product.id);
    }
  }

  console.log(`Created ${createdIds.length} demo products across ${categories.length} categories.`);
  console.log("Product IDs (for cleanup if needed):", createdIds.join(","));
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
