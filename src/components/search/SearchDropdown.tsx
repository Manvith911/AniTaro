import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { getSuggestions, Anime } from "@/lib/api";
import { Loader2 } from "lucide-react";

interface SearchDropdownProps {
  query: string;
  onSelect: () => void;
}

export default function SearchDropdown({ query, onSelect }: SearchDropdownProps) {
  const [suggestions, setSuggestions] = useState<Anime[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (query.length < 2) {
        setSuggestions([]);
        return;
      }
      
      setLoading(true);
      try {
        const data = await getSuggestions(query);
        setSuggestions(data.suggestions || []);
      } catch (error) {
        console.error("Failed to fetch suggestions:", error);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounce);
  }, [query]);

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="absolute top-full left-0 right-0 mt-2 p-4 bg-popover border border-border rounded-lg shadow-xl"
      >
        <div className="flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      </motion.div>
    );
  }

  if (suggestions.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="absolute top-full left-0 right-0 mt-2 bg-popover border border-border rounded-lg shadow-xl overflow-hidden max-h-96 overflow-y-auto"
    >
      {suggestions.slice(0, 6).map((anime) => (
        <Link
          key={anime.id}
          to={`/anime/${anime.id}`}
          onClick={onSelect}
          className="flex items-center gap-3 p-3 hover:bg-muted transition-colors"
        >
          <img
            src={anime.poster}
            alt={anime.name}
            className="w-12 h-16 object-cover rounded"
          />
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium text-foreground line-clamp-1">
              {anime.name}
            </h4>
            {anime.jname && (
              <p className="text-xs text-muted-foreground line-clamp-1">
                {anime.jname}
              </p>
            )}
            <div className="flex items-center gap-2 mt-1">
              {anime.type && (
                <span className="text-xs px-1.5 py-0.5 bg-primary/20 text-primary rounded">
                  {anime.type}
                </span>
              )}
              {anime.episodes?.sub && (
                <span className="text-xs text-muted-foreground">
                  EP {anime.episodes.sub}
                </span>
              )}
            </div>
          </div>
        </Link>
      ))}
    </motion.div>
  );
}
