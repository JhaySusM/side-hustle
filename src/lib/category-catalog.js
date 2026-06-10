export const CATEGORY_CATALOG = [
  {
    key: "mobiles",
    category_name: "Electronics",
    display_name: "Mobiles",
    image_url: "/img/category/Mobiles1.png",
  },
  {
    key: "vehicles",
    category_name: "Vehicles",
    display_name: "Cars",
    image_url: "/img/category/Vehicles.png",
  },
  {
    key: "property-rent",
    category_name: "Property For Rent",
    display_name: "Property For Rent",
    image_url: "/img/category/Property%20For%20Rent.png",
  },
  {
    key: "fashion",
    category_name: "Clothes",
    display_name: "Clothes",
    image_url: "/img/category/Fashion.png",
  },
  {
    key: "property",
    category_name: "Property",
    display_name: "Property",
    image_url: "/img/category/Property.png",
  },
  {
    key: "service",
    category_name: "Service",
    display_name: "Services",
    image_url: "/img/category/Service.png",
  },
  {
    key: "food",
    category_name: "Food",
    display_name: "Foods",
    image_url: "/img/category/Food.png",
  },
  {
    key: "furniture",
    category_name: "Furniture",
    display_name: "Furniture",
    image_url: "/img/category/Furniture.png",
  },
  {
    key: "books",
    category_name: "Books",
    display_name: "Books",
    image_url: "/img/category/Books.png",
  },
  {
    key: "sports",
    category_name: "Sports",
    display_name: "Sports",
    image_url: "/img/category/Sports.png",
  },
  {
    key: "toys",
    category_name: "Toys",
    display_name: "Toys",
    image_url: "/img/category/Toys.png",
  },
  {
    key: "tools",
    category_name: "Tools",
    display_name: "Tools",
    image_url: "/img/category/Tools.png",
  },
];

export const HIDDEN_CATEGORY_NAMES = new Set(["Gaming", "Music"]);

export const FALLBACK_CATEGORY_IMAGES = {
  Electronics: "https://img.icons8.com/ios-filled/50/000000/laptop.png",
  Vehicles: "https://img.icons8.com/ios-filled/50/000000/car.png",
  Furniture: "https://img.icons8.com/ios-filled/50/000000/sofa.png",
  Clothes: "https://img.icons8.com/ios-filled/50/000000/t-shirt.png",
  Sports: "https://img.icons8.com/ios-filled/50/000000/basketball.png",
  Books: "https://img.icons8.com/ios-filled/50/000000/book.png",
  Music: "https://img.icons8.com/ios-filled/50/000000/musical-notes.png",
  Gaming: "https://img.icons8.com/ios-filled/50/000000/controller.png",
};

export const DEFAULT_CATEGORY_IMAGE = "https://img.icons8.com/ios-filled/50/000000/category.png";

export function filterVisibleCategories(categories) {
  return categories.filter((category) => !HIDDEN_CATEGORY_NAMES.has(category.category_name));
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