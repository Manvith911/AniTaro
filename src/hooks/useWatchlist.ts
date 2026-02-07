 import { useState, useEffect, useCallback } from "react";
 import { supabase } from "@/integrations/supabase/client";
 import { useAuth } from "./useAuth";
 import { toast } from "sonner";
 
 export type WatchlistStatus = "watching" | "completed" | "plan_to_watch" | "dropped";
 
 export interface WatchlistItem {
   id: string;
   user_id: string;
   anime_id: string;
   anime_name: string;
   anime_poster: string | null;
   status: WatchlistStatus;
   created_at: string;
   updated_at: string;
 }
 
 export function useWatchlist() {
   const { user } = useAuth();
   const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
   const [loading, setLoading] = useState(false);
 
   const fetchWatchlist = useCallback(async () => {
     if (!user) return;
     setLoading(true);
     const { data, error } = await supabase
       .from("watchlist")
       .select("*")
       .eq("user_id", user.id)
       .order("updated_at", { ascending: false });
 
     if (error) {
       console.error("Error fetching watchlist:", error);
     } else {
       setWatchlist((data as WatchlistItem[]) || []);
     }
     setLoading(false);
   }, [user]);
 
   useEffect(() => {
     fetchWatchlist();
   }, [fetchWatchlist]);
 
   const addToWatchlist = async (
     animeId: string,
     animeName: string,
     animePoster: string | null,
     status: WatchlistStatus
   ) => {
     if (!user) {
       toast.error("Please sign in to add to watchlist");
       return false;
     }
 
     const { error } = await supabase.from("watchlist").upsert(
       {
         user_id: user.id,
         anime_id: animeId,
         anime_name: animeName,
         anime_poster: animePoster,
         status,
       },
       { onConflict: "user_id,anime_id" }
     );
 
     if (error) {
       console.error("Error adding to watchlist:", error);
       toast.error("Failed to add to watchlist");
       return false;
     }
 
     toast.success(`Added to ${status.replace("_", " ")}`);
     await fetchWatchlist();
     
     // Subscribe to this anime for new episode notifications
     await subscribeToAnime(animeId, animeName);
     
     return true;
   };
 
   const removeFromWatchlist = async (animeId: string) => {
     if (!user) return false;
 
     const { error } = await supabase
       .from("watchlist")
       .delete()
       .eq("user_id", user.id)
       .eq("anime_id", animeId);
 
     if (error) {
       console.error("Error removing from watchlist:", error);
       toast.error("Failed to remove from watchlist");
       return false;
     }
 
     toast.success("Removed from watchlist");
     await fetchWatchlist();
     
     // Unsubscribe from anime notifications
     await unsubscribeFromAnime(animeId);
     
     return true;
   };
 
   const getWatchlistStatus = (animeId: string): WatchlistStatus | null => {
     const item = watchlist.find((w) => w.anime_id === animeId);
     return item?.status || null;
   };
 
   const subscribeToAnime = async (animeId: string, animeName: string) => {
     if (!user) return;
     await supabase.from("anime_subscriptions").upsert(
       {
         user_id: user.id,
         anime_id: animeId,
         anime_name: animeName,
       },
       { onConflict: "user_id,anime_id" }
     );
   };
 
   const unsubscribeFromAnime = async (animeId: string) => {
     if (!user) return;
     await supabase
       .from("anime_subscriptions")
       .delete()
       .eq("user_id", user.id)
       .eq("anime_id", animeId);
   };
 
   return {
     watchlist,
     loading,
     addToWatchlist,
     removeFromWatchlist,
     getWatchlistStatus,
     refreshWatchlist: fetchWatchlist,
   };
 }