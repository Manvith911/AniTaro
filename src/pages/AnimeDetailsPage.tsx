import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Play, Star, Clock, Calendar, Building2, Users, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import Header from "@/components/layout/Header";
import AnimeCard from "@/components/anime/AnimeCard";
 import WatchlistButton from "@/components/anime/WatchlistButton";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getAnimeDetails, getAnimeEpisodes, type AnimeDetails, type EpisodeData } from "@/lib/api";
import { getContinueWatchingForAnime } from "@/hooks/useContinueWatching";

export default function AnimeDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<AnimeDetails | null>(null);
  const [episodesData, setEpisodesData] = useState<EpisodeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      if (!id) return;
      setLoading(true);
      try {
        const [details, episodes] = await Promise.all([
          getAnimeDetails(id),
          getAnimeEpisodes(id),
        ]);
        console.log('Anime details:', details);
        console.log('Episodes:', episodes);
        setData(details);
        setEpisodesData(episodes);
      } catch (err) {
        console.error("Failed to fetch anime details:", err);
        setError("Failed to load anime details.");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="pt-16">
          <div className="h-[50vh] shimmer" />
          <div className="container mx-auto px-4 -mt-32 relative z-10">
            <div className="flex flex-col md:flex-row gap-8">
              <div className="w-64 h-96 shimmer rounded-xl" />
              <div className="flex-1 space-y-4">
                <div className="h-10 w-3/4 shimmer rounded" />
                <div className="h-6 w-1/2 shimmer rounded" />
                <div className="h-32 w-full shimmer rounded" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="pt-16 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Anime not found</h2>
            <p className="text-muted-foreground">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const { anime, seasons, relatedAnimes, recommendedAnimes } = data;
  const { info, moreInfo } = anime;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Background */}
      <div className="relative h-[50vh] overflow-hidden">
        <img
          src={info.poster}
          alt={info.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-background/30" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-transparent" />
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 -mt-48 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col lg:flex-row gap-8"
        >
          {/* Poster */}
          <div className="flex-shrink-0">
            <img
              src={info.poster}
              alt={info.name}
              className="w-48 md:w-64 h-auto rounded-xl shadow-2xl mx-auto lg:mx-0"
            />
            
            {/* Action Buttons */}
            <div className="mt-4 flex gap-2">
              {(() => {
                const cw = id ? getContinueWatchingForAnime(id) : null;
                return (
                  <Link to={`/watch/${id}`} className="flex-1">
                    <Button className="w-full gap-2 bg-foreground hover:bg-foreground/90 text-background">
                      <Play className="w-5 h-5 fill-current" />
                      {cw ? `Continue Episode ${cw.episodeNumber}` : "Watch Now"}
                    </Button>
                  </Link>
                );
              })()}
              <WatchlistButton
                animeId={id!}
                animeName={info.name}
                animePoster={info.poster}
                variant="icon"
              />
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 space-y-6">
            {/* Title */}
            <div>
              <h1 className="text-3xl md:text-4xl font-bold">{info.name}</h1>
              {moreInfo.japanese && (
                <p className="text-lg text-muted-foreground mt-1">{moreInfo.japanese}</p>
              )}
            </div>

            {/* Stats */}
            <div className="flex flex-wrap items-center gap-4">
              {info.stats.rating && (
                <div className="flex items-center gap-1 px-3 py-1.5 bg-warning/20 text-warning rounded-full">
                  <Star className="w-4 h-4 fill-current" />
                  <span className="font-semibold">{info.stats.rating}</span>
                </div>
              )}
              {info.stats.quality && (
                <span className="px-3 py-1.5 bg-primary/20 text-primary rounded-full font-medium">
                  {info.stats.quality}
                </span>
              )}
              {info.stats.type && (
                <span className="px-3 py-1.5 bg-muted text-muted-foreground rounded-full">
                  {info.stats.type}
                </span>
              )}
              {info.stats.episodes && (
                <span className="px-3 py-1.5 bg-muted text-muted-foreground rounded-full">
                  {info.stats.episodes.sub} Episodes
                </span>
              )}
            </div>

            {/* Meta Info */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {moreInfo.aired && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-primary" />
                  <span className="text-muted-foreground">{moreInfo.aired}</span>
                </div>
              )}
              {moreInfo.duration && (
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-primary" />
                  <span className="text-muted-foreground">{moreInfo.duration}</span>
                </div>
              )}
              {moreInfo.studios && (
                <div className="flex items-center gap-2 text-sm">
                  <Building2 className="w-4 h-4 text-primary" />
                  <span className="text-muted-foreground">{moreInfo.studios}</span>
                </div>
              )}
              {moreInfo.status && (
                <div className="flex items-center gap-2 text-sm">
                  <Users className="w-4 h-4 text-primary" />
                  <span className="text-muted-foreground">{moreInfo.status}</span>
                </div>
              )}
            </div>

            {/* Genres */}
            {moreInfo.genres && moreInfo.genres.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {moreInfo.genres.map((genre) => (
                  <Link
                    key={genre}
                    to={`/genre/${genre.toLowerCase()}`}
                    className="px-3 py-1.5 bg-muted hover:bg-primary/20 hover:text-primary rounded-full text-sm transition-colors"
                  >
                    {genre}
                  </Link>
                ))}
              </div>
            )}

            {/* Description */}
            <p className="text-muted-foreground leading-relaxed">
              {info.description}
            </p>
          </div>
        </motion.div>

        {/* Tabs Section */}
        <Tabs defaultValue="episodes" className="mt-12">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="episodes">Episodes</TabsTrigger>
            {info.charactersVoiceActors && info.charactersVoiceActors.length > 0 && (
              <TabsTrigger value="characters">Characters</TabsTrigger>
            )}
            {info.promotionalVideos && info.promotionalVideos.length > 0 && (
              <TabsTrigger value="trailers">Trailers</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="episodes" className="mt-6">
            {episodesData && episodesData.episodes.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {episodesData.episodes.map((episode) => (
                  <Link
                    key={episode.episodeId}
                    to={`/watch/${id}?ep=${episode.episodeId}`}
                    className="p-3 bg-card rounded-lg hover:bg-primary/20 transition-colors text-center"
                  >
                    <span className="font-medium">EP {episode.number}</span>
                    {episode.title && episode.title !== `Episode ${episode.number}` && (
                      <p className="text-xs text-muted-foreground line-clamp-1 mt-1">{episode.title}</p>
                    )}
                    <div className="flex items-center justify-center gap-2 mt-1">
                      {episode.hasSub && <span className="text-xs px-1 py-0.5 bg-primary/20 text-primary rounded">SUB</span>}
                      {episode.hasDub && <span className="text-xs px-1 py-0.5 bg-accent/20 text-accent-foreground rounded">DUB</span>}
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <Link
                to={`/watch/${id}`}
                className="flex items-center justify-between p-4 bg-card rounded-xl hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <Play className="w-8 h-8 text-primary" />
                  <div>
                    <h3 className="font-semibold">Start Watching</h3>
                    <p className="text-sm text-muted-foreground">
                      {info.stats.episodes?.sub || 0} episodes available
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </Link>
            )}
          </TabsContent>

          {info.charactersVoiceActors && (
            <TabsContent value="characters" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {info.charactersVoiceActors.slice(0, 10).map((cv, index) => (
                  <div key={index} className="flex items-center gap-4 p-4 bg-card rounded-xl">
                    <img
                      src={cv.character.poster}
                      alt={cv.character.name}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                    <div className="flex-1">
                      <h4 className="font-medium">{cv.character.name}</h4>
                      <p className="text-sm text-muted-foreground">{cv.character.cast}</p>
                    </div>
                    {cv.voiceActor && (
                      <>
                        <div className="text-right flex-1">
                          <h4 className="font-medium">{cv.voiceActor.name}</h4>
                          <p className="text-sm text-muted-foreground">{cv.voiceActor.cast}</p>
                        </div>
                        <img
                          src={cv.voiceActor.poster}
                          alt={cv.voiceActor.name}
                          className="w-16 h-16 rounded-full object-cover"
                        />
                      </>
                    )}
                  </div>
                ))}
              </div>
            </TabsContent>
          )}

          {info.promotionalVideos && (
            <TabsContent value="trailers" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {info.promotionalVideos.map((video, index) => (
                  <a
                    key={index}
                    href={video.source}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative aspect-video rounded-xl overflow-hidden"
                  >
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      className="w-full h-full object-cover transition-transform group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-background/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Play className="w-12 h-12 text-primary" />
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-background">
                      <p className="text-sm font-medium">{video.title}</p>
                    </div>
                  </a>
                ))}
              </div>
            </TabsContent>
          )}
        </Tabs>

        {/* Seasons */}
        {seasons && seasons.length > 1 && (
          <section className="mt-12">
            <h2 className="text-2xl font-bold mb-6">Seasons</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {seasons.map((season) => (
                <Link
                  key={season.id}
                  to={`/anime/${season.id}`}
                  className={`group relative rounded-xl overflow-hidden ${
                    season.isCurrent ? "ring-2 ring-primary" : ""
                  }`}
                >
                  <img
                    src={season.poster}
                    alt={season.title}
                    className="w-full aspect-[3/4] object-cover transition-transform group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <p className="text-sm font-medium line-clamp-2">{season.title}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Related Anime */}
        {relatedAnimes && relatedAnimes.length > 0 && (
          <section className="mt-12">
            <h2 className="text-2xl font-bold mb-6">Related Anime</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {relatedAnimes.slice(0, 6).map((anime, index) => (
                <AnimeCard key={anime.id} anime={anime} index={index} />
              ))}
            </div>
          </section>
        )}

        {/* Recommendations */}
        {recommendedAnimes && recommendedAnimes.length > 0 && (
          <section className="mt-12 pb-16">
            <h2 className="text-2xl font-bold mb-6">Recommended</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {recommendedAnimes.slice(0, 12).map((anime, index) => (
                <AnimeCard key={anime.id} anime={anime} index={index} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
