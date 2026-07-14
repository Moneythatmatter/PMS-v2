import { FbCatchAllClient } from "@/components/foodbeverages/FbCatchAllClient";

interface PageProps {
  params: Promise<{ slug: string[] }>;
}

export default async function FoodBeveragesCatchAllPage({ params }: PageProps) {
  const { slug } = await params;
  const path = `/food-beverages/${slug.join("/")}`;

  return <FbCatchAllClient path={path} />;
}
