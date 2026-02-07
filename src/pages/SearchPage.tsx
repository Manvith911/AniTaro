import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Header from "@/components/layout/Header";
import AnimeCard from "@/components/anime/AnimeCard";
import { SkeletonCard } from "@/components/ui/skeleton-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { searchAnime, type Anime } from "@/lib/api";

interface SearchResult {
  animes: Anime[];
  currentPage: number;
  hasNextPage: boolean;
  totalPages: number;
}

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const page = parseInt(searchParams.get("page") || "1");

  const [searchQuery, setSearchQuery] = useState(query);
  const [results, setResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchResults() {
      if (!query) {
        setResults(null);
        return;
      }
      setLoading(true);
      try {
        const data = await searchAnime(query, page);
        setResults(data);
      } catch (error) {
        console.error("Search failed:", error);
        setResults(null);
      } finally {
        setLoading(false);
      }
    }
    fetchResults();
  }, [query, page]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setSearchParams({ q: searchQuery.trim(), page: "1" });
    }
  };

  const changePage = (newPage: number) => {
    setSearchParams({ q: query, page: newPage.toString() });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Search Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-4">Search Anime</h1>
            <form onSubmit={handleSearch} className="flex gap-2 max-w-xl">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search for anime..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12 bg-muted/50"
                />
              </div>
              <Button type="submit" size="lg">
                Search
              </Button>
            </form>
          </div>

          {/* Search Results */}
          {query && (
            <div className="mb-4">
              <p className="text-muted-foreground">
                {loading
                  ? "Searching..."
                  : results
                  ? `Found results for "${query}"`
                  : `No results for "${query}"`}
              </p>
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : results && results.animes.length > 0 ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {results.animes.map((anime, index) => (
                  <AnimeCard key={anime.id} anime={anime} index={index} />
                ))}
              </div>

              {/* Pagination */}
              {results.totalPages > 1 && (
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
                    Page {page} of {results.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => changePage(page + 1)}
                    disabled={!results.hasNextPage}
                  >
                    Next
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              )}
            </>
          ) : query ? (
            <div className="text-center py-16">
              <p className="text-lg text-muted-foreground">No anime found matching your search.</p>
              <p className="text-sm text-muted-foreground mt-2">Try different keywords or browse our categories.</p>
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-lg text-muted-foreground">Enter a search term to find anime.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
