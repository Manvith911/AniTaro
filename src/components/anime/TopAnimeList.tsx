import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Play, Captions, Mic } from "lucide-react";
import type { Anime } from "@/lib/api";

interface TopAnimeListProps {
  today: Anime[];
  week: Anime[];
  month: Anime[];
}

type Tab = "today" | "week" | "month";

export default function TopAnimeList({ today, week, month }: TopAnimeListProps) {
  const [activeTab, setActiveTab] = useState<Tab>("today");

  const tabs: { key: Tab; label: string }[] = [
    { key: "today", label: "Daily" },
    { key: "week", label: "Weekly" },
    { key: "month", label: "Monthly" },
  ];

  const getAnimes = () => {
    switch (activeTab) {
      case "today": return today;
      case "week": return week;
      case "month": return month;
    }
  };

  const animes = getAnimes();

  if (animes.length === 0) return null;

  return (
    <section className="py-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Top 10</h2>
        <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === tab.key
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-3"
      >
        {animes.slice(0, 10).map((anime, index) => (
          <Link
            key={anime.id}
            to={`/anime/${anime.id}`}
            className="group flex items-center gap-4 p-3 rounded-xl bg-card hover:bg-muted/50 transition-colors"
          >
            {/* Rank */}
            <div
              className={`w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-lg font-bold text-lg ${
                index < 3
                  ? "bg-gradient-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {index + 1}
            </div>

            {/* Poster */}
            <div className="relative w-14 h-20 flex-shrink-0 rounded-lg overflow-hidden">
              <img
                src={anime.poster}
                alt={anime.name}
                className="w-full h-full object-cover transition-transform group-hover:scale-110"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-background/50 opacity-0 group-hover:opacity-100 transition-opacity">
                <Play className="w-5 h-5 text-primary fill-current" />
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h3 className="font-medium line-clamp-2 text-sm group-hover:text-primary transition-colors">
                {anime.name}
              </h3>
              <div className="flex items-center gap-3 mt-1">
                {anime.episodes?.sub && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Captions className="w-3 h-3 text-primary" />
                    <span>{anime.episodes.sub}</span>
                  </div>
                )}
                {anime.episodes?.dub && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Mic className="w-3 h-3 text-secondary" />
                    <span>{anime.episodes.dub}</span>
                  </div>
                )}
              </div>
            </div>
          </Link>
        ))}
      </motion.div>
    </section>
  );
}
