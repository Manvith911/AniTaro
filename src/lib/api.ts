const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

async function fetchFromProxy(path: string) {
  const response = await fetch(
    `${SUPABASE_URL}/functions/v1/cors-proxy?path=${encodeURIComponent(path)}`
  );
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }
  return response.json();
}

export function getM3U8ProxyUrl(url: string, referer?: string) {
  const base = `${SUPABASE_URL}/functions/v1/m3u8-proxy?url=${encodeURIComponent(url)}`;
  return referer ? `${base}&referer=${encodeURIComponent(referer)}` : base;
}

// Normalize anime object from API response
function normalizeAnime(anime: RawAnime): Anime {
  return {
    id: anime.id,
    name: anime.name,
    jname: anime.romaji,
    poster: anime.posterImage,
    rating: anime.rating,
    episodes: anime.episodes,
    type: anime.type,
    duration: anime.duration,
  };
}

function normalizeSpotlightAnime(anime: RawSpotlightAnime): SpotlightAnime {
  // Extract rank from spotlight string like "#1 Spotlight"
  const rankMatch = anime.spotlight?.match(/#(\d+)/);
  const rank = rankMatch ? parseInt(rankMatch[1]) : 1;
  
  return {
    id: anime.id,
    name: anime.name,
    jname: anime.romaji,
    poster: anime.posterImage,
    rating: anime.rating,
    episodes: anime.episodes,
    type: anime.type,
    duration: anime.duration,
    rank,
    description: anime.synopsis || '',
    otherInfo: [anime.type, anime.releaseDate, anime.quality].filter(Boolean) as string[],
  };
}

// Home - returns normalized data matching API structure
export async function getHome(): Promise<HomeData> {
  const raw = await fetchFromProxy('/api/kaido/home');
  
  // Map API response to our normalized structure
  const spotlightAnimes = (raw.data || []).map(normalizeSpotlightAnime);
  const trendingAnimes = (raw.trending || []).map(normalizeAnime);
  const latestEpisodeAnimes = (raw.recentlyUpdated || []).map(normalizeAnime);
  const topUpcomingAnimes = (raw.topUpcoming || []).map(normalizeAnime);
  const topAiringAnimes = (raw.topAiring || []).map(normalizeAnime);
  const mostPopularAnimes = (raw.mostPopular || []).map(normalizeAnime);
  const mostFavoriteAnimes = (raw.favourites || []).map(normalizeAnime);
  const latestCompletedAnimes = (raw.recentlyCompleted || []).map(normalizeAnime);
  const recentlyAddedAnimes = (raw.recentlyAdded || []).map(normalizeAnime);
  
  // Handle topAnime structure with daily/weekly/monthly
  const top10Animes = {
    today: (raw.topAnime?.daily || []).map(normalizeAnime),
    week: (raw.topAnime?.weekly || []).map(normalizeAnime),
    month: (raw.topAnime?.monthly || []).map(normalizeAnime),
  };
  
  return {
    spotlightAnimes,
    trendingAnimes,
    latestEpisodeAnimes,
    topUpcomingAnimes,
    top10Animes,
    topAiringAnimes,
    mostPopularAnimes,
    mostFavoriteAnimes,
    latestCompletedAnimes,
    recentlyAddedAnimes,
    genres: [],
  };
}

// Search - returns data array
export async function searchAnime(query: string, page = 1) {
  const raw = await fetchFromProxy(`/api/kaido/anime/search?q=${encodeURIComponent(query)}&page=${page}`);
  return {
    animes: (raw.data || []).map(normalizeAnime),
    currentPage: raw.currentPage || page,
    hasNextPage: raw.hasNextPage || false,
    totalPages: raw.lastPage || 1,
  };
}

// Suggestions - returns data array
export async function getSuggestions(query: string) {
  const raw = await fetchFromProxy(`/api/kaido/anime/suggestions?q=${encodeURIComponent(query)}`);
  return {
    suggestions: (raw.data || []).map(normalizeAnime),
  };
}

// Categories: subbed, dubbed, favourites, popular, airing
export async function getCategory(category: string, page = 1) {
  const raw = await fetchFromProxy(`/api/kaido/anime/category/${category}?page=${page}`);
  return {
    animes: (raw.data || []).map(normalizeAnime),
    currentPage: raw.currentPage || 1,
    hasNextPage: raw.hasNextPage || false,
    totalPages: raw.lastPage || 1,
  };
}

// Recent: completed, added, updated
export async function getRecent(status: string, page = 1) {
  const raw = await fetchFromProxy(`/api/kaido/anime/recent/${status}?page=${page}`);
  return {
    animes: (raw.data || []).map(normalizeAnime),
    currentPage: raw.currentPage || 1,
    hasNextPage: raw.hasNextPage || false,
    totalPages: raw.lastPage || 1,
  };
}

// Genre
export async function getGenre(genre: string, page = 1) {
  const raw = await fetchFromProxy(`/api/kaido/anime/genre/${genre}?page=${page}`);
  return {
    animes: (raw.data || []).map(normalizeAnime),
    currentPage: raw.currentPage || 1,
    hasNextPage: raw.hasNextPage || false,
    totalPages: raw.lastPage || 1,
  };
}

// Format: TV, MOVIE, SPECIALS, OVA, ONA
export async function getFormat(format: string, page = 1) {
  const raw = await fetchFromProxy(`/api/kaido/anime/format/${format}?page=${page}`);
  return {
    animes: (raw.data || []).map(normalizeAnime),
    currentPage: raw.currentPage || 1,
    hasNextPage: raw.hasNextPage || false,
    totalPages: raw.lastPage || 1,
  };
}

// A-Z List
export async function getAZList(sort: string, page = 1) {
  const raw = await fetchFromProxy(`/api/kaido/anime/az-list/${sort}?page=${page}`);
  return {
    animes: (raw.data || []).map(normalizeAnime),
    currentPage: raw.currentPage || 1,
    hasNextPage: raw.hasNextPage || false,
    totalPages: raw.lastPage || 1,
  };
}

// Anime Details
export async function getAnimeDetails(id: string): Promise<AnimeDetails> {
  const raw = await fetchFromProxy(`/api/kaido/anime/${id}`);
  const data = raw.data || raw;
  
  return {
    anime: {
      info: {
        id: data.id || id,
        name: data.name,
        poster: data.posterImage,
        description: data.synopsis || '',
        stats: {
          rating: data.rating,
          quality: data.quality,
          episodes: data.episodes || { sub: 0, dub: 0 },
          type: data.type,
          duration: data.duration,
        },
        promotionalVideos: (raw.promotionVideos || []).map((v: RawPromoVideo) => ({
          title: v.title,
          source: v.url,
          thumbnail: v.thumbnail,
        })),
        charactersVoiceActors: (raw.characters || []).map((c: RawCharacter) => ({
          character: {
            id: c.id,
            poster: c.posterImage,
            name: c.name,
            cast: c.role,
          },
          voiceActor: c.voiceActor ? {
            id: c.voiceActor.id,
            poster: c.voiceActor.posterImage,
            name: c.voiceActor.name,
            cast: c.voiceActor.language,
          } : null,
        })),
      },
      moreInfo: {
        japanese: data.japanese,
        synonyms: data.altnames,
        aired: data.releaseDate,
        status: data.status,
        malscore: data.score,
        genres: data.genres,
        studios: data.studios?.join(', '),
        producers: Array.isArray(data.producers) ? data.producers : [],
      },
    },
    seasons: (raw.relatedSeasons || []).map((s: RawSeason) => ({
      id: s.id,
      name: s.name,
      title: s.season || s.name,
      poster: s.seasonPoster,
      isCurrent: s.id === id,
    })),
    mostPopularAnimes: (raw.mostPopular || []).map(normalizeAnime),
    relatedAnimes: (raw.relatedAnime || []).map(normalizeAnime),
    recommendedAnimes: (raw.recommendedAnime || []).map(normalizeAnime),
  };
}

// Episodes - uses the details endpoint which includes providerEpisodes
export async function getAnimeEpisodes(id: string): Promise<EpisodeData> {
  const raw = await fetchFromProxy(`/api/kaido/anime/${id}`);
  // Episodes come from providerEpisodes in the details response
  const episodes = raw.providerEpisodes || [];
  
  return {
    totalEpisodes: episodes.length,
    episodes: episodes.map((ep: RawEpisode) => ({
      title: ep.title || `Episode ${ep.episodeNumber}`,
      episodeId: ep.episodeId,
      number: ep.episodeNumber,
      isFiller: false,
      hasSub: ep.hasSub,
      hasDub: ep.hasDub,
    })),
  };
}

// Episode Servers
export async function getEpisodeServers(episodeId: string): Promise<ServersData> {
  const raw = await fetchFromProxy(`/api/kaido/episode/${episodeId}/servers`);
  const data = raw.data || raw;
  
  return {
    sub: (data.sub || []).map((s: RawServer) => ({
      serverId: String(s.severId || s.serverId),
      serverName: s.serverName,
    })),
    dub: (data.dub || []).map((s: RawServer) => ({
      serverId: String(s.severId || s.serverId),
      serverName: s.serverName,
    })),
    raw: (data.raw || []).map((s: RawServer) => ({
      serverId: String(s.severId || s.serverId),
      serverName: s.serverName,
    })),
    episodeId,
    episodeNo: data.episodeNumber || 1,
  };
}

// Episode Sources
export async function getEpisodeSources(episodeId: string, version = 'sub', server = 'vidcloud'): Promise<SourcesData> {
  const raw = await fetchFromProxy(`/api/kaido/sources/${episodeId}?version=${version}&server=${server}`);
  const data = raw.data || raw;
  const referer = raw?.headers?.Referer || raw?.headers?.referer;
  
  return {
    referer,
    sources: (data.sources || []).map((s: RawSource) => ({
      url: s.url,
      type: s.isM3u8 ? 'hls' : (s.type || 'hls'),
    })),
    subtitles: (data.subtitles || []).map((s: RawSubtitle & { url?: string; lang?: string }) => ({
      file: s.file || s.url || '',
      label: s.label || s.lang || 'Unknown',
      kind: s.kind || 'captions',
      default: s.default || false,
    })),
    intro: data.intro,
    outro: data.outro,
  };
}

// Raw types from API
interface RawAnime {
  id: string;
  name: string;
  romaji?: string;
  posterImage: string;
  rating?: string;
  episodes?: { sub?: number; dub?: number };
  type?: string;
  duration?: string;
  totalEpisodes?: number;
}

interface RawSpotlightAnime extends RawAnime {
  spotlight?: string;
  synopsis?: string;
  releaseDate?: string;
  quality?: string;
}

interface RawSeason {
  id: string;
  name: string;
  season?: string;
  seasonPoster?: string;
}

interface RawEpisode {
  episodeId: string;
  title?: string;
  romaji?: string;
  episodeNumber: number;
  hasSub?: boolean;
  hasDub?: boolean;
}

interface RawServer {
  severId?: number;
  serverId?: number;
  serverName: string;
  mediaId?: string;
}

interface RawSource {
  url: string;
  isM3u8?: boolean;
  type?: string;
}

interface RawSubtitle {
  file: string;
  label: string;
  kind?: string;
  default?: boolean;
}

interface RawPromoVideo {
  url: string;
  title: string;
  thumbnail: string;
}

interface RawCharacter {
  id: string;
  name: string;
  posterImage: string;
  role: string;
  voiceActor?: {
    id: string;
    name: string;
    posterImage: string;
    language: string;
  };
}

// Normalized types
export interface Anime {
  id: string;
  name: string;
  jname?: string;
  poster: string;
  rating?: string;
  episodes?: {
    sub?: number;
    dub?: number;
  };
  type?: string;
  duration?: string;
}

export interface SpotlightAnime extends Anime {
  rank: number;
  description: string;
  otherInfo?: string[];
}

export interface HomeData {
  spotlightAnimes: SpotlightAnime[];
  trendingAnimes: Anime[];
  latestEpisodeAnimes: Anime[];
  topUpcomingAnimes: Anime[];
  top10Animes: {
    today: Anime[];
    week: Anime[];
    month: Anime[];
  };
  topAiringAnimes: Anime[];
  mostPopularAnimes: Anime[];
  mostFavoriteAnimes: Anime[];
  latestCompletedAnimes: Anime[];
  recentlyAddedAnimes: Anime[];
  genres: string[];
}

export interface AnimeDetails {
  anime: {
    info: {
      id: string;
      name: string;
      poster: string;
      description: string;
      stats: {
        rating?: string;
        quality?: string;
        episodes: { sub: number; dub: number };
        type?: string;
        duration?: string;
      };
      promotionalVideos?: { title: string; source: string; thumbnail: string }[];
      charactersVoiceActors?: { character: { id: string; poster: string; name: string; cast: string }; voiceActor: { id: string; poster: string; name: string; cast: string } | null }[];
    };
    moreInfo: {
      japanese?: string;
      synonyms?: string;
      aired?: string;
      premiered?: string;
      duration?: string;
      status?: string;
      malscore?: string;
      genres?: string[];
      studios?: string;
      producers?: string[];
    };
  };
  seasons?: { id: string; name: string; title: string; poster: string; isCurrent: boolean }[];
  mostPopularAnimes?: Anime[];
  relatedAnimes?: Anime[];
  recommendedAnimes?: Anime[];
}

export interface Episode {
  title: string;
  episodeId: string;
  number: number;
  isFiller: boolean;
  hasSub?: boolean;
  hasDub?: boolean;
}

export interface EpisodeData {
  totalEpisodes: number;
  episodes: Episode[];
}

export interface Server {
  serverName: string;
  serverId: string;
}

export interface ServersData {
  sub: Server[];
  dub: Server[];
  raw: Server[];
  episodeId: string;
  episodeNo: number;
}

export interface Source {
  url: string;
  type: string;
}

export interface Subtitle {
  file: string;
  label: string;
  kind: string;
  default?: boolean;
}

export interface SourcesData {
  sources: Source[];
  subtitles: Subtitle[];
  referer?: string;
  intro?: { start: number; end: number };
  outro?: { start: number; end: number };
}
