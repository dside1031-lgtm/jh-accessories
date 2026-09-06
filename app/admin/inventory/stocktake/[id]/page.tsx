import StocktakeDetailClient from "./StocktakeDetailClient";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function StocktakeDetailPage({
  params,
}: PageProps) {
  const resolvedParams = await params;

  const id = decodeURIComponent(
    String(resolvedParams?.id ?? "")
  ).trim();

  return <StocktakeDetailClient stocktakeId={id} />;
}