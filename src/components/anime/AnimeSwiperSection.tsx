import { Link } from "react-router-dom";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, FreeMode } from "swiper/modules";
import AnimeCard from "./AnimeCard";
import type { Anime } from "@/lib/api";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/free-mode";

interface AnimeSwiperSectionProps {
  title: string;
  animes: Anime[];
  viewAllLink?: string;
  showRank?: boolean;
  sectionId: string;
}

export default function AnimeSwiperSection({ 
  title, 
  animes, 
  viewAllLink, 
  showRank = false,
  sectionId 
}: AnimeSwiperSectionProps) {
  if (!animes || animes.length === 0) return null;

  return (
    <section className="py-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">{title}</h2>
        <div className="flex items-center gap-2">
          {/* Custom Navigation Buttons */}
          <button
            className={`swiper-prev-${sectionId} p-2 rounded-full bg-muted hover:bg-primary/20 transition-colors disabled:opacity-50`}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            className={`swiper-next-${sectionId} p-2 rounded-full bg-muted hover:bg-primary/20 transition-colors disabled:opacity-50`}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          {viewAllLink && (
            <Link
              to={viewAllLink}
              className="flex items-center gap-1 text-sm text-primary hover:text-primary/80 transition-colors ml-2"
            >
              View All
              <ChevronRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      </div>
      <Swiper
        modules={[Navigation, FreeMode]}
        spaceBetween={16}
        slidesPerView={2}
        freeMode={true}
        navigation={{
          prevEl: `.swiper-prev-${sectionId}`,
          nextEl: `.swiper-next-${sectionId}`,
        }}
        breakpoints={{
          480: { slidesPerView: 3, spaceBetween: 16 },
          640: { slidesPerView: 4, spaceBetween: 16 },
          768: { slidesPerView: 5, spaceBetween: 16 },
          1024: { slidesPerView: 6, spaceBetween: 16 },
          1280: { slidesPerView: 7, spaceBetween: 16 },
        }}
        className="anime-swiper"
      >
        {animes.map((anime, index) => (
          <SwiperSlide key={anime.id}>
            <AnimeCard anime={anime} index={index} showRank={showRank} />
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
}
