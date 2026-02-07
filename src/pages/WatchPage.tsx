import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, Captions, Mic, Radio, Settings, Search, Play, SkipForward, FastForward } from "lucide-react";
import { motion } from "framer-motion";
import Header from "@/components/layout/Header";
import VideoPlayer from "@/components/player/VideoPlayer";
import CommentSection from "@/components/comments/CommentSection";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getAnimeDetails,
  getAnimeEpisodes,
  getEpisodeServers,
  getEpisodeSources,
  type AnimeDetails,
  type EpisodeData,
  type ServersData,
  type SourcesData,
} from "@/lib/api";
import { setContinueWatching } from "@/hooks/useContinueWatching";

type Version = "sub" | "dub" | "raw";

export default function WatchPage() {
  const { id } = useParams<{ id: string }>();
  const [animeData, setAnimeData] = useState<AnimeDetails | null>(null);
  const [episodesData, setEpisodesData] = useState<EpisodeData | null>(null);
  const [servers, setServers] = useState<ServersData | null>(null);
  const [sources, setSources] = useState<SourcesData | null>(null);
  const [currentEpisode, setCurrentEpisode] = useState<string | null>(null);
  const [currentEpisodeNumber, setCurrentEpisodeNumber] = useState(1);
  const [version, setVersion] = useState<Version>("sub");
  const [selectedServer, setSelectedServer] = useState<string>("vidcloud");
  const [loading, setLoading] = useState(true);
  const [sourcesLoading, setSourcesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [episodeSearch, setEpisodeSearch] = useState("");
  const playerRef = useRef<HTMLDivElement>(null);
  const [playerHeight, setPlayerHeight] = useState<number | null>(null);
  const [autoplay, setAutoplay] = useState(() => localStorage.getItem("player_autoplay") === "true");
  const [autoSkipIntro, setAutoSkipIntro] = useState(() => localStorage.getItem("player_autoskip") === "true");
  const [autoNext, setAutoNext] = useState(() => localStorage.getItem("player_autonext") === "true");

  // Persist settings
  useEffect(() => { localStorage.setItem("player_autoplay", String(autoplay)); }, [autoplay]);
  useEffect(() => { localStorage.setItem("player_autoskip", String(autoSkipIntro)); }, [autoSkipIntro]);
  useEffect(() => { localStorage.setItem("player_autonext", String(autoNext)); }, [autoNext]);

  const handleAutoNext = useCallback(() => {
    if (!episodesData) return;
    const currentIndex = episodesData.episodes.findIndex(ep => ep.episodeId === currentEpisode);
    if (currentIndex < episodesData.episodes.length - 1) {
      const nextEp = episodesData.episodes[currentIndex + 1];
      handleEpisodeChange(nextEp.episodeId, nextEp.number);
    }
  }, [episodesData, currentEpisode]);

  // Fetch anime and episodes data
  useEffect(() => {
    async function fetchData() {
      if (!id) return;
      setLoading(true);
      try {
        const [anime, episodes] = await Promise.all([
          getAnimeDetails(id),
          getAnimeEpisodes(id),
        ]);
        setAnimeData(anime);
        setEpisodesData(episodes);
        
        // Set first episode
        if (episodes.episodes.length > 0) {
          const firstEp = episodes.episodes[0];
          setCurrentEpisode(firstEp.episodeId);
          setCurrentEpisodeNumber(firstEp.number);
          setContinueWatching({
            animeId: id,
            animeName: anime.anime.info.name,
            animePoster: anime.anime.info.poster,
            episodeId: firstEp.episodeId,
            episodeNumber: firstEp.number,
            timestamp: Date.now(),
          });
        }
      } catch (err) {
        console.error("Failed to fetch watch data:", err);
        setError("Failed to load anime data.");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  // Fetch servers when episode changes
  useEffect(() => {
    async function fetchServers() {
      if (!currentEpisode) return;
      try {
        const serversData = await getEpisodeServers(currentEpisode);
        setServers(serversData);
        
        // Auto-select first available server
        const versionServers = version === "sub" 
          ? serversData.sub 
          : version === "dub" 
          ? serversData.dub 
          : serversData.raw;
        
        if (versionServers && versionServers.length > 0) {
          // Prefer servers that are known to be more reliable.
          // (We can still let users manually switch to any server below.)
          const preferredOrder = ["vidcloud", "vidstreaming", "streamtape", "filemoon"];
          const normalized = versionServers.map((s) => s.serverName.toLowerCase());
          const preferred = preferredOrder.find((name) => normalized.includes(name));
          setSelectedServer(preferred ?? normalized[0]);
        }
      } catch (err) {
        console.error("Failed to fetch servers:", err);
      }
    }
    fetchServers();
  }, [currentEpisode, version]);

  // Fetch sources when server changes
  useEffect(() => {
    async function fetchSources() {
      if (!currentEpisode || !selectedServer) return;
      setSourcesLoading(true);
      try {
        const sourcesData = await getEpisodeSources(currentEpisode, version, selectedServer);
        setSources(sourcesData);
      } catch (err) {
        console.error("Failed to fetch sources:", err);
        setSources(null);
      } finally {
        setSourcesLoading(false);
      }
    }
    fetchSources();
  }, [currentEpisode, version, selectedServer]);

  const handleEpisodeChange = (episodeId: string, episodeNumber: number) => {
    setCurrentEpisode(episodeId);
    setCurrentEpisodeNumber(episodeNumber);
    // Save to continue watching
    if (id && animeData) {
      setContinueWatching({
        animeId: id,
        animeName: animeData.anime.info.name,
        animePoster: animeData.anime.info.poster,
        episodeId,
        episodeNumber,
        timestamp: Date.now(),
      });
    }
  };

  const goToPreviousEpisode = () => {
    if (!episodesData) return;
    const currentIndex = episodesData.episodes.findIndex(ep => ep.episodeId === currentEpisode);
    if (currentIndex > 0) {
      const prevEp = episodesData.episodes[currentIndex - 1];
      handleEpisodeChange(prevEp.episodeId, prevEp.number);
    }
  };

  const goToNextEpisode = () => {
    if (!episodesData) return;
    const currentIndex = episodesData.episodes.findIndex(ep => ep.episodeId === currentEpisode);
    if (currentIndex < episodesData.episodes.length - 1) {
      const nextEp = episodesData.episodes[currentIndex + 1];
      handleEpisodeChange(nextEp.episodeId, nextEp.number);
    }
  };

  const getVersionServers = () => {
    if (!servers) return [];
    return version === "sub" ? servers.sub : version === "dub" ? servers.dub : servers.raw;
  };

  const filteredEpisodes = episodesData?.episodes.filter(ep => {
    if (!episodeSearch.trim()) return true;
    const q = episodeSearch.trim().toLowerCase();
    return (
      String(ep.number).includes(q) ||
      ep.title?.toLowerCase().includes(q)
    );
  }) || [];

  // Measure player height
  useEffect(() => {
    if (!playerRef.current) return;
    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        setPlayerHeight(entry.contentRect.height);
      }
    });
    observer.observe(playerRef.current);
    return () => observer.disconnect();
  }, [sourcesLoading, sources]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="pt-16">
          <div className="container mx-auto px-4 py-8">
            <div className="aspect-video shimmer rounded-xl" />
            <div className="mt-6 space-y-4">
              <div className="h-8 w-1/2 shimmer rounded" />
              <div className="h-6 w-1/4 shimmer rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !animeData) {
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

  const { anime } = animeData;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-20 pb-16">
        <div className="container mx-auto px-4">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <Link to="/" className="hover:text-primary">Home</Link>
            <ChevronRight className="w-4 h-4" />
            <Link to={`/anime/${id}`} className="hover:text-primary">{anime.info.name}</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-foreground">Episode {currentEpisodeNumber}</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-8">
            {/* Player Section */}
            <div className="lg:col-span-2 space-y-4">
              <div ref={playerRef}>
              {/* Video Player */}
              {sourcesLoading ? (
                <div className="aspect-video bg-muted rounded-xl flex items-center justify-center">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    <p className="text-muted-foreground">Loading video...</p>
                  </div>
                </div>
              ) : sources ? (
                <VideoPlayer
                  sources={sources}
                  autoplay={autoplay}
                  autoSkipIntro={autoSkipIntro}
                  autoNext={autoNext}
                  onEnded={handleAutoNext}
                />
              ) : (
                <div className="aspect-video bg-muted rounded-xl flex items-center justify-center">
                  <p className="text-muted-foreground">No sources available</p>
                </div>
              )}
              </div>

              {/* Episode Navigation */}
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  onClick={goToPreviousEpisode}
                  disabled={!episodesData || episodesData.episodes.findIndex(ep => ep.episodeId === currentEpisode) === 0}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Episode {currentEpisodeNumber} of {episodesData?.totalEpisodes || 0}
                </span>
                <Button
                  variant="outline"
                  onClick={goToNextEpisode}
                  disabled={!episodesData || episodesData.episodes.findIndex(ep => ep.episodeId === currentEpisode) === episodesData.episodes.length - 1}
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>

              {/* Version & Server Selection */}
              <div className="p-4 bg-card rounded-xl space-y-4">
                {/* Version Tabs */}
                <div className="flex items-center gap-2">
                  <Settings className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Version:</span>
                  <div className="flex gap-2">
                    {servers?.sub && servers.sub.length > 0 && (
                      <Button
                        variant={version === "sub" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setVersion("sub")}
                        className="gap-1"
                      >
                        <Captions className="w-4 h-4" />
                        Sub
                      </Button>
                    )}
                    {servers?.dub && servers.dub.length > 0 && (
                      <Button
                        variant={version === "dub" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setVersion("dub")}
                        className="gap-1"
                      >
                        <Mic className="w-4 h-4" />
                        Dub
                      </Button>
                    )}
                    {servers?.raw && servers.raw.length > 0 && (
                      <Button
                        variant={version === "raw" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setVersion("raw")}
                        className="gap-1"
                      >
                        <Radio className="w-4 h-4" />
                        Raw
                      </Button>
                    )}
                  </div>
                </div>

                {/* Server Selection */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-muted-foreground">Server:</span>
                  {getVersionServers().map((server) => (
                    <Button
                      key={server.serverId}
                      variant={selectedServer === server.serverName.toLowerCase() ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedServer(server.serverName.toLowerCase())}
                    >
                      {server.serverName}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Player Settings */}
              <div className="p-4 bg-card rounded-xl space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <Settings className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Player Settings</span>
                </div>
                <div className="flex flex-wrap gap-x-6 gap-y-3">
                  <div className="flex items-center gap-2">
                    <Switch id="autoplay" checked={autoplay} onCheckedChange={setAutoplay} />
                    <Label htmlFor="autoplay" className="text-sm flex items-center gap-1.5 cursor-pointer">
                      <Play className="w-3.5 h-3.5" /> Autoplay
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch id="autoskip" checked={autoSkipIntro} onCheckedChange={setAutoSkipIntro} />
                    <Label htmlFor="autoskip" className="text-sm flex items-center gap-1.5 cursor-pointer">
                      <FastForward className="w-3.5 h-3.5" /> Auto Skip Intro
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch id="autonext" checked={autoNext} onCheckedChange={setAutoNext} />
                    <Label htmlFor="autonext" className="text-sm flex items-center gap-1.5 cursor-pointer">
                      <SkipForward className="w-3.5 h-3.5" /> Auto Next
                    </Label>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-card rounded-xl">
                <div className="flex gap-4">
                  <img
                    src={anime.info.poster}
                    alt={anime.info.name}
                    className="w-24 h-32 object-cover rounded-lg"
                  />
                  <div>
                    <h1 className="text-xl font-bold">{anime.info.name}</h1>
                    <p className="text-sm text-muted-foreground line-clamp-3 mt-2">
                      {anime.info.description}
                    </p>
                    <Link
                      to={`/anime/${id}`}
                      className="text-sm text-primary hover:underline mt-2 inline-block"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              </div>

              {/* Comments Section */}
              <CommentSection episodeId={currentEpisode || ""} animeId={id || ""} />
            </div>

            {/* Episodes List */}
            <div className="lg:col-span-1">
              <div className="sticky top-24">
                <h2 className="text-xl font-bold mb-4">Episodes</h2>
                <div
                  className="bg-card rounded-xl flex flex-col"
                  style={playerHeight && window.innerWidth >= 1024 ? { height: `${playerHeight}px` } : { maxHeight: '500px' }}
                >
                  {/* Episode Search */}
                  <div className="p-3 border-b border-border/50">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="text"
                        placeholder="Search episode..."
                        value={episodeSearch}
                        onChange={(e) => setEpisodeSearch(e.target.value)}
                        className="pl-9 bg-muted/50 border-border/50 h-9"
                      />
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-3 space-y-2">
                    {filteredEpisodes.map((episode) => (
                      <motion.button
                        key={episode.episodeId}
                        onClick={() => handleEpisodeChange(episode.episodeId, episode.number)}
                        className={`w-full text-left p-3 rounded-lg transition-colors ${
                          currentEpisode === episode.episodeId
                            ? "bg-primary/20 text-primary border border-primary/50"
                            : "hover:bg-muted"
                        } ${episode.isFiller ? "border-l-4 border-l-warning" : ""}`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">Episode {episode.number}</span>
                          {episode.isFiller && (
                            <span className="text-xs px-2 py-0.5 bg-warning/20 text-warning rounded">
                              Filler
                            </span>
                          )}
                        </div>
                        {episode.title && episode.title !== `Episode ${episode.number}` && (
                          <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                            {episode.title}
                          </p>
                        )}
                      </motion.button>
                    ))}
                    {filteredEpisodes.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">No episodes found</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
