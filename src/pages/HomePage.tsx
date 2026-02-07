import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Play, X } from "lucide-react";
import Header from "@/components/layout/Header";
import SpotlightCarousel from "@/components/anime/SpotlightCarousel";
import AnimeSwiperSection from "@/components/anime/AnimeSwiperSection";
import TopAnimeList from "@/components/anime/TopAnimeList";
import { SkeletonSpotlight, SkeletonSection } from "@/components/ui/skeleton-card";
import { getHome, type HomeData } from "@/lib/api";
import { getContinueWatching, removeContinueWatching, type ContinueWatchingEntry } from "@/hooks/useContinueWatching";

export default function HomePage() {
  const [data, setData] = useState<HomeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [continueWatching, setContinueWatching] = useState<ContinueWatchingEntry[]>([]);

  useEffect(() => {
    setContinueWatching(getContinueWatching());
  }, []);

  useEffect(() => {
    async function fetchData() {
      try {
        const homeData = await getHome();
        setData(homeData);
      } catch (err) {
        console.error("Failed to fetch home data:", err);
        setError("Failed to load content. Please try again later.");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="pt-16 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Something went wrong</h2>
            <p className="text-muted-foreground">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {loading ? (
        <SkeletonSpotlight />
      ) : (
        data?.spotlightAnimes && data.spotlightAnimes.length > 0 && (
          <SpotlightCarousel animes={data.spotlightAnimes} />
        )
      )}

      <main className="container mx-auto px-4 -mt-8 relative z-10">
        {/* Continue Watching */}
        {continueWatching.length > 0 && (
          <section className="py-6">
            <h2 className="text-2xl font-bold mb-4">Continue Watching</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {continueWatching.map((entry) => (
                <div key={entry.animeId} className="relative group">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      removeContinueWatching(entry.animeId);
                      setContinueWatching(prev => prev.filter(e2 => e2.animeId !== entry.animeId));
                    }}
                    className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive hover:text-destructive-foreground"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <Link
                    to={`/watch/${entry.animeId}`}
                    className="block rounded-xl overflow-hidden card-hover"
                  >
                    <img
                      src={entry.animePoster}
                      alt={entry.animeName}
                      className="w-full aspect-[3/4] object-cover transition-transform group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-12 h-12 rounded-full bg-foreground/90 flex items-center justify-center">
                        <Play className="w-5 h-5 text-background fill-current" />
                      </div>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <p className="text-sm font-medium line-clamp-2">{entry.animeName}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Episode {entry.episodeNumber}
                      </p>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </section>
        )}

        {loading ? (
          <>
            <SkeletonSection />
            <SkeletonSection />
            <SkeletonSection />
          </>
        ) : (
          data && (
            <>
              {data.trendingAnimes.length > 0 && (
                <AnimeSwiperSection
                  title="Trending Now"
                  animes={data.trendingAnimes}
                  viewAllLink="/category/popular"
                  sectionId="trending"
                />
              )}

              {data.latestEpisodeAnimes.length > 0 && (
                <AnimeSwiperSection
                  title="Recently Updated"
                  animes={data.latestEpisodeAnimes}
                  viewAllLink="/recent/updated"
                  sectionId="updated"
                />
              )}

              <div className="py-8">
                {(data.top10Animes.today.length > 0 || 
                  data.top10Animes.week.length > 0 || 
                  data.top10Animes.month.length > 0) && (
                  <TopAnimeList
                    today={data.top10Animes.today}
                    week={data.top10Animes.week}
                    month={data.top10Animes.month}
                  />
                )}
              </div>

              {data.recentlyAddedAnimes && data.recentlyAddedAnimes.length > 0 && (
                <AnimeSwiperSection
                  title="Recently Added"
                  animes={data.recentlyAddedAnimes}
                  viewAllLink="/recent/added"
                  sectionId="added"
                />
              )}

              {data.topUpcomingAnimes.length > 0 && (
                <AnimeSwiperSection
                  title="Upcoming Anime"
                  animes={data.topUpcomingAnimes}
                  sectionId="upcoming"
                />
              )}
            </>
          )
        )}
      </main>

      <footer className="border-t border-border mt-16 py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p className="text-gradient font-bold text-xl mb-2">AniTaro</p>
          <p className="text-sm">Your ultimate anime streaming destination</p>
        </div>
      </footer>
    </div>
  );
}
