import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import AnimeCard from "./AnimeCard";
import type { Anime } from "@/lib/api";

interface AnimeSectionProps {
  title: string;
  animes: Anime[];
  viewAllLink?: string;
  showRank?: boolean;
}

export default function AnimeSection({ title, animes, viewAllLink, showRank = false }: AnimeSectionProps) {
  if (!animes || animes.length === 0) return null;

  return (
    <section className="py-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">{title}</h2>
        {viewAllLink && (
          <Link
            to={viewAllLink}
            className="flex items-center gap-1 text-sm text-primary hover:text-primary/80 transition-colors"
          >
            View All
            <ChevronRight className="w-4 h-4" />
          </Link>
        )}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {animes.slice(0, 12).map((anime, index) => (
          <AnimeCard key={anime.id} anime={anime} index={index} showRank={showRank} />
        ))}
      </div>
    </section>
  );
}
