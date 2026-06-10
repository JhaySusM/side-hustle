import ListingsPageClient from "./ListingsPageClient";

export default async function ListingsPage({ searchParams }) {
  const params = await searchParams;
  const initialQuery = typeof params?.q === "string" ? params.q : "";
  const initialCategory = typeof params?.category === "string" ? params.category : "";
  const initialLocation = typeof params?.location === "string" ? params.location : "";

  return (
    <ListingsPageClient
      key={`${initialQuery}::${initialCategory}::${initialLocation}`}
      initialQuery={initialQuery}
      initialCategory={initialCategory}
      initialLocation={initialLocation}
    />
  );
}