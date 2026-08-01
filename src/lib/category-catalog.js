export const CATEGORY_CATALOG = [
  {
    key: "cars",
    category_name: "Cars",
    display_name: "Cars",
    image_url: "/img/category/Vehicles.png",
    subcategories: [
      "Sale",
      "Purchase",
      "Advertise",
      "Commercial rentals",
      "Accessories",
      "Showroom contact details",
      "Brokers (transfer, inspection teams, documentation, tax payments)",
    ],
  },
  {
    key: "property",
    category_name: "Property",
    display_name: "Property",
    image_url: "/img/category/Property.png",
    subcategories: [
      "Sale",
      "Purchase",
      "Rent",
      "Advertise (on buildings)",
      "Documentation and property office details",
      "Transfers and other related procedures",
    ],
  },
  {
    key: "travel",
    category_name: "Travel",
    display_name: "Travel",
    image_url: "https://img.icons8.com/ios-filled/50/000000/bed.png",
    subcategories: ["Hotels"],
  },
  {
    key: "electronics-appliances",
    category_name: "Electronics & appliances",
    display_name: "Electronics & appliances",
    image_url: "https://img.icons8.com/ios-filled/50/000000/electrical.png",
    subcategories: [
      "Computers & laptops",
      "Cameras & accessories",
      "TVs & entertainment",
      "Kitchen appliances",
      "Cooling & heating",
      "Other home appliances",
    ],
  },
  {
    key: "mobiles-tablets",
    category_name: "Mobiles & tablets",
    display_name: "Mobiles & tablets",
    image_url: "/img/category/Mobiles1.png",
    subcategories: [
      "Smartphones",
      "Tablets",
      "Smartwatches",
      "Phone accessories",
      "Landline & cordless phones",
      "SIMs & mobile numbers",
    ],
  },
  {
    key: "bikes-two-wheelers",
    category_name: "Bikes & two-wheelers",
    display_name: "Bikes & two-wheelers",
    image_url: "https://img.icons8.com/ios-filled/50/000000/motorcycle.png",
    subcategories: [
      "Motorbikes",
      "Bicycles",
      "Scooters",
      "Spare parts & accessories",
      "ATVs & quads",
      "Servicing & repair",
    ],
  },
  {
    key: "jobs-careers",
    category_name: "Jobs & careers",
    display_name: "Jobs & careers",
    image_url: "https://img.icons8.com/ios-filled/50/000000/briefcase.png",
    subcategories: [
      "Full-time positions",
      "Part-time & freelance",
      "Hospitality staff",
      "Education & tutoring",
      "Domestic staff",
      "Delivery & driving",
      "Skilled trades",
    ],
  },
  {
    key: "business-industrial",
    category_name: "Business & industrial",
    display_name: "Business & industrial",
    image_url: "https://img.icons8.com/ios-filled/50/000000/factory.png",
    subcategories: [
      "Machinery & equipment",
      "Construction tools",
      "Agriculture supplies",
      "Wholesale & trade",
      "Businesses for sale",
    ],
  },
  {
    key: "services",
    category_name: "Services",
    display_name: "Services",
    image_url: "/img/category/Service.png",
    subcategories: [
      "Home repair & maintenance",
      "Events & catering",
      "Tutoring & consultancy",
      "Legal & documentation help",
      "Beauty & wellness",
      "Equipment rentals",
    ],
  },
  {
    key: "fashion-beauty",
    category_name: "Fashion & beauty",
    display_name: "Fashion & beauty",
    image_url: "/img/category/Fashion.png",
    subcategories: [
      "Clothing",
      "Footwear",
      "Bags & accessories",
      "Watches & jewelry",
      "Beauty & personal care",
    ],
  },
  {
    key: "furniture-home",
    category_name: "Furniture & home",
    display_name: "Furniture & home",
    image_url: "/img/category/Furniture.png",
    subcategories: [
      "Beds & wardrobes",
      "Sofas & seating",
      "Dining & tables",
      "Home decor",
      "Kitchen & bath essentials",
      "Garden & outdoor",
    ],
  },
  {
    key: "animals-hobbies-kids",
    category_name: "Animals, hobbies & kids",
    display_name: "Animals, hobbies & kids",
    image_url: "https://img.icons8.com/ios-filled/50/000000/pet.png",
    subcategories: [
      "Pets & adoption",
      "Livestock & birds",
      "Sports & fitness gear",
      "Books & instruments",
      "Toys & kids gear",
    ],
  },
];

export const HIDDEN_CATEGORY_NAMES = new Set();

export const CATEGORY_NAME_ALIASES = {};

export function normalizeCategoryName(categoryName) {
  return CATEGORY_NAME_ALIASES[categoryName] || categoryName;
}

export function normalizeCategory(category) {
  if (!category) {
    return category;
  }

  return {
    ...category,
    category_name: normalizeCategoryName(category.category_name),
  };
}

export function normalizeProductCategory(product) {
  if (!product) {
    return product;
  }

  return {
    ...product,
    category: normalizeCategory(product.category),
  };
}

export function getCategoryFilterNames(categoryName) {
  return [normalizeCategoryName(categoryName)];
}

export const FALLBACK_CATEGORY_IMAGES = {};

export const DEFAULT_CATEGORY_IMAGE = "https://img.icons8.com/ios-filled/50/000000/category.png";

export function filterVisibleCategories(categories) {
  return categories
    .map((category) => normalizeCategory(category))
    .filter((category) => !HIDDEN_CATEGORY_NAMES.has(category.category_name));
}

export function buildVisualCategories(categories) {
  const visibleCategories = filterVisibleCategories(categories);
  const matches = new Map(visibleCategories.map((category) => [category.category_name.toLowerCase(), category]));
  const catalogNames = new Set(CATEGORY_CATALOG.map((item) => item.category_name.toLowerCase()));

  const visualCategories = CATEGORY_CATALOG.map((item) => {
    const matchedCategory = matches.get(item.category_name.toLowerCase());

    return {
      id: matchedCategory?.id ?? `catalog-${item.key}`,
      category_name: item.category_name,
      display_name: item.display_name,
      image_url: item.image_url,
      product_count: matchedCategory?._count?.products ?? 0,
      is_catalog_only: !matchedCategory,
    };
  });

  const extraCategories = visibleCategories
    .filter((category) => !catalogNames.has(category.category_name.toLowerCase()))
    .map((category) => ({
      ...category,
      display_name: category.category_name,
      image_url: FALLBACK_CATEGORY_IMAGES[category.category_name] || DEFAULT_CATEGORY_IMAGE,
      product_count: category._count?.products ?? 0,
      is_catalog_only: false,
    }));

  return [...visualCategories, ...extraCategories];
}
