import { listShows } from "@/lib/api/catalog";
import { ShowCard } from "@/components/catalog/ShowCard";
import { AppHeader } from "@/components/layout/AppHeader";
import { BottomNav } from "@/components/layout/BottomNav";

// Renderizado em request-time (SSR), não em build-time: a página depende de um
// fetch contra a API, que não está garantidamente disponível durante `next build`
// (ex: pipeline de build da Vercel). Sem isso, o build de produção falha.
export const dynamic = "force-dynamic";

export default async function CatalogPage() {
  const shows = await listShows();

  return (
    <>
      <AppHeader />
      <main className="p-6 pb-24">
        <h1 className="mb-6 text-2xl font-bold">Catálogo</h1>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {shows.map((show) => (
            <ShowCard
              key={show.id}
              id={show.id}
              title={show.title}
              synopsis={show.synopsis}
              thumbnailKey={show.thumbnailKey}
            />
          ))}
        </div>
      </main>
      <BottomNav />
    </>
  );
}
