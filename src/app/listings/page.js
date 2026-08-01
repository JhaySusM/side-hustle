import ListingsPageClient from "./ListingsPageClient";

export default async function ListingsPage({ searchParams }) {
  const params = await searchParams;
  const initialQuery = typeof params?.q === "string" ? params.q : "";
  const initialCategory = typeof params?.category === "string" ? params.category : "";
  const initialSubcategory = typeof params?.subcategory === "string" ? params.subcategory : "";
  const initialLocation = typeof params?.location === "string" ? params.location : "";

  return (
    <ListingsPageClient
      key={`${initialQuery}::${initialCategory}::${initialSubcategory}::${initialLocation}`}
      initialQuery={initialQuery}
      initialCategory={initialCategory}
      initialSubcategory={initialSubcategory}
      initialLocation={initialLocation}
    />
  );
}