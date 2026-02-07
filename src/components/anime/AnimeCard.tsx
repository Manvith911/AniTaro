import { Link } from "react-router-dom";
import { Play, Star, Mic, Captions } from "lucide-react";
import { motion } from "framer-motion";
import type { Anime } from "@/lib/api";

interface AnimeCardProps {
  anime: Anime;
  index?: number;
  showRank?: boolean;
}

export default function AnimeCard({ anime, index = 0, showRank = false }: AnimeCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
    >
      <Link to={`/anime/${anime.id}`} className="block group">
        <div className="relative overflow-hidden rounded-lg card-hover">
          {/* Poster */}
          <div className="aspect-[3/4] relative">
            <img
              src={anime.poster}
              alt={anime.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              loading="lazy"
            />
            
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            {/* Play button overlay */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="w-14 h-14 rounded-full bg-primary/90 flex items-center justify-center glow-primary">
                <Play className="w-6 h-6 text-primary-foreground fill-current ml-1" />
              </div>
            </div>

            {/* Rank badge */}
            {showRank && index !== undefined && (
              <div className="absolute top-2 left-2 w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center">
                <span className="text-sm font-bold text-primary-foreground">
                  {index + 1}
                </span>
              </div>
            )}

            {/* Rating */}
            {anime.rating && (
              <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 bg-background/80 backdrop-blur-sm rounded-md">
                <Star className="w-3 h-3 text-warning fill-warning" />
                <span className="text-xs font-medium">{anime.rating}</span>
              </div>
            )}

            {/* Episode count badges */}
            <div className="absolute bottom-2 left-2 flex items-center gap-1.5">
              {anime.episodes?.sub && (
                <div className="flex items-center gap-1 px-2 py-1 bg-primary/90 text-primary-foreground rounded-md text-xs font-medium">
                  <Captions className="w-3 h-3" />
                  <span>{anime.episodes.sub}</span>
                </div>
              )}
              {anime.episodes?.dub && (
                <div className="flex items-center gap-1 px-2 py-1 bg-secondary/90 text-secondary-foreground rounded-md text-xs font-medium">
                  <Mic className="w-3 h-3" />
                  <span>{anime.episodes.dub}</span>
                </div>
              )}
            </div>
          </div>

          {/* Title */}
          <div className="p-2">
            <h3 className="text-sm font-medium line-clamp-2 text-foreground group-hover:text-primary transition-colors">
              {anime.name}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              {anime.type && (
                <span className="text-xs text-muted-foreground">{anime.type}</span>
              )}
              {anime.duration && (
                <span className="text-xs text-muted-foreground">• {anime.duration}</span>
              )}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
