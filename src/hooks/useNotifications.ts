 import { useState, useEffect, useCallback } from "react";
 import { supabase } from "@/integrations/supabase/client";
 import { useAuth } from "./useAuth";
 
 export type NotificationType = "reply" | "like" | "mention" | "new_episode";
 
 export interface Notification {
   id: string;
   user_id: string;
   type: NotificationType;
   title: string;
   message: string;
   link: string | null;
   related_comment_id: string | null;
   related_anime_id: string | null;
   from_user_id: string | null;
   is_read: boolean;
   created_at: string;
   from_user?: {
     username: string;
     avatar_url: string | null;
   };
 }
 
 export function useNotifications() {
   const { user } = useAuth();
   const [notifications, setNotifications] = useState<Notification[]>([]);
   const [unreadCount, setUnreadCount] = useState(0);
   const [loading, setLoading] = useState(false);
 
   const fetchNotifications = useCallback(async () => {
     if (!user) return;
     setLoading(true);
     
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);
 
     if (error) {
       console.error("Error fetching notifications:", error);
     } else {
       const typedData = (data || []) as unknown as Notification[];
       setNotifications(typedData);
       setUnreadCount(typedData.filter((n) => !n.is_read).length);
     }
     setLoading(false);
   }, [user]);
 
   useEffect(() => {
     fetchNotifications();
   }, [fetchNotifications]);
 
   // Real-time subscription
   useEffect(() => {
     if (!user) return;
 
     const channel = supabase
       .channel("notifications")
       .on(
         "postgres_changes",
         {
           event: "INSERT",
           schema: "public",
           table: "notifications",
           filter: `user_id=eq.${user.id}`,
         },
         () => {
           fetchNotifications();
         }
       )
       .subscribe();
 
     return () => {
       supabase.removeChannel(channel);
     };
   }, [user, fetchNotifications]);
 
   const markAsRead = async (notificationId: string) => {
     if (!user) return;
     
     await supabase
       .from("notifications")
       .update({ is_read: true })
       .eq("id", notificationId);
     
     setNotifications((prev) =>
       prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
     );
     setUnreadCount((prev) => Math.max(0, prev - 1));
   };
 
   const markAllAsRead = async () => {
     if (!user) return;
     
     await supabase
       .from("notifications")
       .update({ is_read: true })
       .eq("user_id", user.id)
       .eq("is_read", false);
     
     setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
     setUnreadCount(0);
   };
 
   const createNotification = async (
     targetUserId: string,
     type: NotificationType,
     title: string,
     message: string,
     link?: string,
     relatedCommentId?: string,
     relatedAnimeId?: string
   ) => {
     if (!user || targetUserId === user.id) return;
 
     await supabase.from("notifications").insert({
       user_id: targetUserId,
       type,
       title,
       message,
       link,
       related_comment_id: relatedCommentId,
       related_anime_id: relatedAnimeId,
       from_user_id: user.id,
     });
   };
 
   return {
     notifications,
     unreadCount,
     loading,
     markAsRead,
     markAllAsRead,
     createNotification,
     refreshNotifications: fetchNotifications,
   };
 }