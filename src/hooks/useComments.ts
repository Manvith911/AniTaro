 import { useState, useEffect, useCallback } from "react";
 import { supabase } from "@/integrations/supabase/client";
 import { useAuth } from "./useAuth";
 import { useNotifications } from "./useNotifications";
 import { toast } from "sonner";
 
 export interface Comment {
   id: string;
   user_id: string;
   episode_id: string;
   anime_id: string;
   content: string;
   image_url: string | null;
   parent_id: string | null;
   likes_count: number;
   dislikes_count: number;
   created_at: string;
   updated_at: string;
   user?: {
     username: string;
     display_name: string | null;
     avatar_url: string | null;
   };
   replies?: Comment[];
   user_reaction?: "like" | "dislike" | null;
 }
 
 export function useComments(episodeId: string, animeId: string) {
   const { user } = useAuth();
   const { createNotification } = useNotifications();
   const [comments, setComments] = useState<Comment[]>([]);
   const [loading, setLoading] = useState(false);
 
  const fetchComments = useCallback(async () => {
    setLoading(true);
    
    // Fetch top-level comments
    const { data: commentsData, error } = await supabase
      .from("comments")
      .select("*")
      .eq("episode_id", episodeId)
      .is("parent_id", null)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching comments:", error);
      setLoading(false);
      return;
    }

    // Fetch user profiles separately and attach to comments
    const userIds = [...new Set((commentsData || []).map(c => c.user_id))];
    
    let profilesMap: Record<string, { username: string; display_name: string | null; avatar_url: string | null }> = {};
    
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, username, display_name, avatar_url")
        .in("user_id", userIds);
      
      if (profiles) {
        profilesMap = Object.fromEntries(
          profiles.map(p => [p.user_id, { username: p.username, display_name: p.display_name, avatar_url: p.avatar_url }])
        );
      }
    }

    // Fetch replies for each comment
    const commentsWithReplies = await Promise.all(
      (commentsData || []).map(async (comment) => {
        const { data: replies } = await supabase
          .from("comments")
          .select("*")
          .eq("parent_id", comment.id)
          .order("created_at", { ascending: true });

        // Fetch profiles for replies
        const replyUserIds = [...new Set((replies || []).map(r => r.user_id))];
        let replyProfilesMap: Record<string, { username: string; display_name: string | null; avatar_url: string | null }> = {};
        
        if (replyUserIds.length > 0) {
          const { data: replyProfiles } = await supabase
            .from("profiles")
            .select("user_id, username, display_name, avatar_url")
            .in("user_id", replyUserIds);
          
          if (replyProfiles) {
            replyProfilesMap = Object.fromEntries(
              replyProfiles.map(p => [p.user_id, { username: p.username, display_name: p.display_name, avatar_url: p.avatar_url }])
            );
          }
        }

        // Fetch user reaction if logged in
        let userReaction = null;
        if (user) {
          const { data: reaction } = await supabase
            .from("comment_reactions")
            .select("reaction_type")
            .eq("comment_id", comment.id)
            .eq("user_id", user.id)
            .single();
          userReaction = reaction?.reaction_type as "like" | "dislike" | null;
        }

        return {
          ...comment,
          user: profilesMap[comment.user_id] || { username: "Unknown", display_name: null, avatar_url: null },
          replies: (replies || []).map(reply => ({
            ...reply,
            user: replyProfilesMap[reply.user_id] || profilesMap[reply.user_id] || { username: "Unknown", display_name: null, avatar_url: null },
          })),
          user_reaction: userReaction,
        };
      })
    );

    setComments(commentsWithReplies as unknown as Comment[]);
    setLoading(false);
  }, [episodeId, user]);
 
   useEffect(() => {
     if (episodeId) {
       fetchComments();
     }
   }, [episodeId, fetchComments]);
 
   const addComment = async (
     content: string,
     imageUrl?: string,
     parentId?: string,
     mentionedUserIds?: string[]
   ) => {
     if (!user) {
       toast.error("Please sign in to comment");
       return null;
     }
 
     // Get current user's display name for notifications
     const { data: currentProfile } = await supabase
       .from("profiles")
       .select("username, display_name")
       .eq("user_id", user.id)
       .single();
     const senderName = currentProfile?.display_name || currentProfile?.username || "Someone";
 
     const { data, error } = await supabase
       .from("comments")
       .insert({
         user_id: user.id,
         episode_id: episodeId,
         anime_id: animeId,
         content,
         image_url: imageUrl,
         parent_id: parentId,
       })
       .select()
       .single();
 
     if (error) {
       console.error("Error adding comment:", error);
       toast.error("Failed to post comment");
       return null;
     }
 
     // Handle mentions
     if (mentionedUserIds && mentionedUserIds.length > 0) {
       for (const mentionedUserId of mentionedUserIds) {
         await supabase.from("comment_mentions").insert({
           comment_id: data.id,
           mentioned_user_id: mentionedUserId,
         });
 
         await createNotification(
           mentionedUserId,
           "mention",
           "You were mentioned",
           `${senderName} mentioned you in a comment`,
           `/watch/${animeId}`,
           data.id,
           animeId
         );
       }
     }
 
     // Notify parent comment author if this is a reply
     if (parentId) {
       const { data: parentComment } = await supabase
         .from("comments")
         .select("user_id")
         .eq("id", parentId)
         .single();
 
       if (parentComment && parentComment.user_id !== user.id) {
         await createNotification(
           parentComment.user_id,
           "reply",
           "New reply to your comment",
           `${senderName} replied to your comment`,
           `/watch/${animeId}`,
           data.id,
           animeId
         );
       }
     }
 
     await fetchComments();
     toast.success("Comment posted!");
     return data;
   };
 
   const reactToComment = async (commentId: string, reactionType: "like" | "dislike") => {
     if (!user) {
       toast.error("Please sign in to react");
       return;
     }
 
     // Check existing reaction
     const { data: existing } = await supabase
       .from("comment_reactions")
       .select("*")
       .eq("comment_id", commentId)
       .eq("user_id", user.id)
       .single();
 
     if (existing) {
       if (existing.reaction_type === reactionType) {
         // Remove reaction
         await supabase
           .from("comment_reactions")
           .delete()
           .eq("id", existing.id);
       } else {
         // Update reaction
         await supabase
           .from("comment_reactions")
           .update({ reaction_type: reactionType })
           .eq("id", existing.id);
       }
     } else {
       // Add new reaction
       await supabase.from("comment_reactions").insert({
         user_id: user.id,
         comment_id: commentId,
         reaction_type: reactionType,
       });
 
        // Notify comment author about the like
        if (reactionType === "like") {
          const { data: comment } = await supabase
            .from("comments")
            .select("user_id, anime_id")
            .eq("id", commentId)
            .single();

          if (comment && comment.user_id !== user.id) {
            const { data: likerProfile } = await supabase
              .from("profiles")
              .select("username, display_name")
              .eq("user_id", user.id)
              .single();
            const likerName = likerProfile?.display_name || likerProfile?.username || "Someone";

            await createNotification(
              comment.user_id,
              "like",
              "Someone liked your comment",
              `${likerName} liked your comment`,
              `/watch/${comment.anime_id}`,
              commentId,
              comment.anime_id
            );
          }
        }
     }
 
     await fetchComments();
   };
 
   const deleteComment = async (commentId: string) => {
     if (!user) return;
 
     const { error } = await supabase
       .from("comments")
       .delete()
       .eq("id", commentId)
       .eq("user_id", user.id);
 
     if (error) {
       console.error("Error deleting comment:", error);
       toast.error("Failed to delete comment");
       return;
     }
 
     toast.success("Comment deleted");
     await fetchComments();
   };
 
   const uploadImage = async (file: File): Promise<string | null> => {
     if (!user) return null;
 
     const fileExt = file.name.split(".").pop();
     const fileName = `${user.id}/${Date.now()}.${fileExt}`;
 
     const { error } = await supabase.storage
       .from("comment-images")
       .upload(fileName, file);
 
     if (error) {
       console.error("Error uploading image:", error);
       toast.error("Failed to upload image");
       return null;
     }
 
     const { data: urlData } = supabase.storage
       .from("comment-images")
       .getPublicUrl(fileName);
 
     return urlData.publicUrl;
   };
 
   return {
     comments,
     loading,
     addComment,
     reactToComment,
     deleteComment,
     uploadImage,
     refreshComments: fetchComments,
   };
 }