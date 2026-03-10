import { useEffect, useState, useCallback } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import Header from "@/components/layout/Header";
import AnimeCard from "@/components/anime/AnimeCard";
import { SkeletonCard } from "@/components/ui/skeleton-card";
import { ErrorState } from "@/components/ui/error-state";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getCategory, getRecent, getGenre, getFormat, getHome, type Anime, type HomeData } from "@/lib/api";

const categoryTitles: Record<string, string> = {
  "subbed": "Subbed Anime",
  "dubbed": "Dubbed Anime",
  "favourites": "Most Favorite",
  "popular": "Most Popular",
  "airing": "Currently Airing",
  "completed": "Recently Completed",
  "added": "Recently Added",
  "updated": "Recently Updated",
  "tv": "TV Series",
  "movie": "Movies",
  "ova": "OVA",
  "ona": "ONA",
  "specials": "Specials",
};

const categoryToHomeField: Record<string, keyof HomeData> = {
  "popular": "mostPopularAnimes",
  "airing": "topAiringAnimes",
  "favourites": "mostFavoriteAnimes",
  "completed": "latestCompletedAnimes",
  "added": "recentlyAddedAnimes",
  "updated": "latestEpisodeAnimes",
};

export default function CategoryPage() {
  const { category, genre, status } = useParams<{ category?: string; genre?: string; status?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parseInt(searchParams.get("page") || "1");
  
  const [animes, setAnimes] = useState<Anime[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [totalPages, setTotalPages] = useState(1);

  const pageKey = category || genre || status || "";

  const fetchData = useCallback(async () => {
    if (!pageKey) return;
    setLoading(true);
    setError(null);
    
    try {
      let data;
      
      if (category) {
        if (['tv', 'movie', 'ova', 'ona', 'specials'].includes(category.toLowerCase())) {
          data = await getFormat(category.toUpperCase(), page);
        } else {
          data = await getCategory(category, page);
        }
      } else if (genre) {
        data = await getGenre(genre, page);
      } else if (status) {
        data = await getRecent(status, page);
      }
      
      if (data?.animes && data.animes.length > 0) {
        setAnimes(data.animes);
        setHasNextPage(data.hasNextPage || false);
        setTotalPages(data.totalPages || 1);
      } else {
        const homeKey = categoryToHomeField[pageKey];
        if (homeKey) {
          const homeData = await getHome();
          const fallbackAnimes = homeData[homeKey];
          if (Array.isArray(fallbackAnimes) && fallbackAnimes.length > 0) {
            setAnimes(fallbackAnimes as Anime[]);
            setHasNextPage(false);
            setTotalPages(1);
          } else {
            setAnimes([]);
            setError("This category is temporarily unavailable.");
          }
        } else {
          setAnimes([]);
        }
      }
    } catch (err) {
      console.error("Failed to fetch category:", err);
      
      const homeKey = categoryToHomeField[pageKey];
      if (homeKey) {
        try {
          const homeData = await getHome();
          const fallbackAnimes = homeData[homeKey];
          if (Array.isArray(fallbackAnimes) && fallbackAnimes.length > 0) {
            setAnimes(fallbackAnimes as Anime[]);
            setHasNextPage(false);
            setTotalPages(1);
            setLoading(false);
            return;
          }
        } catch {
          // Ignore fallback error
        }
      }
      
      setAnimes([]);
      setError("Failed to load content. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [category, genre, status, pageKey, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const changePage = (newPage: number) => {
    setSearchParams({ page: newPage.toString() });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const title = categoryTitles[pageKey] || 
    pageKey.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase()) || 
    "Anime";

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold mb-8">{title}</h1>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {Array.from({ length: 18 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : error ? (
            <ErrorState message={error} onRetry={fetchData} />
          ) : animes.length > 0 ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {animes.map((anime, index) => (
                  <AnimeCard key={anime.id} anime={anime} index={index} />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-4 mt-8">
                  <Button
                    variant="outline"
                    onClick={() => changePage(page - 1)}
                    disabled={page <= 1}
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => changePage(page + 1)}
                    disabled={!hasNextPage}
                  >
                    Next
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-16">
              <p className="text-lg text-muted-foreground">No anime found in this category.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
