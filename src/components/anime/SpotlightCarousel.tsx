import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Play, Info, ChevronLeft, ChevronRight, Star } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import type { SpotlightAnime } from "@/lib/api";

interface SpotlightCarouselProps {
  animes: SpotlightAnime[];
}

// Truncate text helper
function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
}

export default function SpotlightCarousel({ animes }: SpotlightCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % animes.length);
  }, [animes.length]);

  const goToPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + animes.length) % animes.length);
  }, [animes.length]);

  useEffect(() => {
    if (!isAutoPlaying) return;
    const timer = setInterval(goToNext, 8000);
    return () => clearInterval(timer);
  }, [isAutoPlaying, goToNext]);

  const currentAnime = animes[currentIndex];
  if (!currentAnime) return null;

  return (
    <div
      className="relative w-full h-[70vh] min-h-[500px] max-h-[800px] overflow-hidden"
      onMouseEnter={() => setIsAutoPlaying(false)}
      onMouseLeave={() => setIsAutoPlaying(true)}
    >
      {/* Background Images */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7 }}
          className="absolute inset-0"
        >
          <img
            src={currentAnime.poster}
            alt={currentAnime.name}
            className="w-full h-full object-cover"
          />
          {/* Overlay gradients */}
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        </motion.div>
      </AnimatePresence>

      {/* Content */}
      <div className="absolute inset-0 flex items-center">
        <div className="container mx-auto px-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="max-w-2xl"
            >
              {/* Rank */}
              <div className="flex items-center gap-2 mb-4">
                <span className="px-3 py-1 text-sm font-bold bg-gradient-primary text-primary-foreground rounded-full">
                  #{currentAnime.rank} Spotlight
                </span>
                {currentAnime.rating && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-muted/50 rounded-full">
                    <Star className="w-4 h-4 text-warning fill-warning" />
                    <span className="text-sm font-medium">{currentAnime.rating}</span>
                  </div>
                )}
              </div>

              {/* Title - truncated if too long */}
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 leading-tight">
                {truncateText(currentAnime.name, 60)}
              </h1>

              {/* Meta info */}
              {currentAnime.otherInfo && currentAnime.otherInfo.length > 0 && (
                <div className="flex flex-wrap items-center gap-3 mb-4 text-sm text-muted-foreground">
                  {currentAnime.otherInfo.map((info, i) => (
                    <span key={i} className="flex items-center">
                      {i > 0 && <span className="mx-2">•</span>}
                      {info}
                    </span>
                  ))}
                  {currentAnime.episodes?.sub && (
                    <span className="flex items-center">
                      <span className="mx-2">•</span>
                      EP {currentAnime.episodes.sub}
                    </span>
                  )}
                </div>
              )}

              {/* Description - truncated */}
              <p className="text-base text-muted-foreground line-clamp-3 mb-6 max-w-xl">
                {truncateText(currentAnime.description, 200)}
              </p>

              {/* Actions */}
              <div className="flex items-center gap-4">
                <Link to={`/watch/${currentAnime.id}`}>
                  <Button size="lg" className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground glow-primary">
                    <Play className="w-5 h-5 fill-current" />
                    Watch Now
                  </Button>
                </Link>
                <Link to={`/anime/${currentAnime.id}`}>
                  <Button size="lg" variant="outline" className="gap-2 border-border/50 hover:bg-muted">
                    <Info className="w-5 h-5" />
                    Details
                  </Button>
                </Link>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={goToPrev}
        className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-background/50 backdrop-blur-sm flex items-center justify-center text-foreground hover:bg-background/80 transition-colors"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>
      <button
        onClick={goToNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-background/50 backdrop-blur-sm flex items-center justify-center text-foreground hover:bg-background/80 transition-colors"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Dots indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2">
        {animes.slice(0, 10).map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentIndex(i)}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === currentIndex
                ? "w-8 bg-primary"
                : "w-1.5 bg-foreground/30 hover:bg-foreground/50"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
