import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { Send, Image, X, Reply, ThumbsUp, ThumbsDown, Trash2, AtSign, LogIn } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useComments, Comment } from "@/hooks/useComments";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  episodeId: string;
  animeId: string;
}

interface UserSuggestion {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
}

export default function CommentSection({ episodeId, animeId }: Props) {
  const { user, profile } = useAuth();
  const { comments, loading, addComment, reactToComment, deleteComment, uploadImage } =
    useComments(episodeId, animeId);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Comments ({comments.length})</h2>

      {/* Sign in prompt for unauthenticated users */}
      {!user ? (
        <div className="bg-card rounded-xl p-6 text-center">
          <LogIn className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
          <p className="text-muted-foreground mb-4">Sign in to join the discussion</p>
          <Link to="/login">
            <Button className="gap-2">
              <LogIn className="w-4 h-4" />
              Sign in to comment
            </Button>
          </Link>
        </div>
      ) : (
        /* Top-level Comment Input */
        <CommentInput
          profile={profile}
          onSubmit={async (content, imageUrl, mentionedUserIds) => {
            await addComment(content, imageUrl, undefined, mentionedUserIds);
          }}
          uploadImage={uploadImage}
        />
      )}

      {/* Comments List */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex gap-3">
              <div className="w-10 h-10 rounded-full shimmer" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-1/4 shimmer rounded" />
                <div className="h-16 w-full shimmer rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No comments yet. Be the first to comment!
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              onReact={reactToComment}
              onDelete={deleteComment}
              currentUserId={user?.id}
              canReply={!!user}
              onReply={async (content, imageUrl, mentionedUserIds) => {
                await addComment(content, imageUrl, comment.id, mentionedUserIds);
              }}
              uploadImage={uploadImage}
              profile={profile}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Reusable comment input component
interface CommentInputProps {
  profile: { username?: string; avatar_url?: string | null } | null;
  onSubmit: (content: string, imageUrl?: string, mentionedUserIds?: string[]) => Promise<void>;
  uploadImage: (file: File) => Promise<string | null>;
  placeholder?: string;
  onCancel?: () => void;
  autoFocus?: boolean;
  compact?: boolean;
}

function CommentInput({ profile, onSubmit, uploadImage, placeholder, onCancel, autoFocus, compact }: CommentInputProps) {
  const [text, setText] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [showMentions, setShowMentions] = useState(false);
  const [mentionSuggestions, setMentionSuggestions] = useState<UserSuggestion[]>([]);
  const [mentionedUsers, setMentionedUsers] = useState<UserSuggestion[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus) textareaRef.current?.focus();
  }, [autoFocus]);

  useEffect(() => {
    const searchUsers = async () => {
      if (!showMentions) {
        setMentionSuggestions([]);
        return;
      }
      const query = supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url, user_id");
      
      if (mentionQuery && mentionQuery.length > 0) {
        query.ilike("username", `%${mentionQuery}%`);
      }
      
      const { data } = await query.limit(8);
      if (data) {
        setMentionSuggestions(data.map(d => ({
          id: d.user_id,
          username: d.username,
          display_name: d.display_name,
          avatar_url: d.avatar_url,
        })));
      }
    };
    const timer = setTimeout(searchUsers, 200);
    return () => clearTimeout(timer);
  }, [mentionQuery, showMentions]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setText(value);
    const lastAtIndex = value.lastIndexOf("@");
    if (lastAtIndex !== -1 && lastAtIndex < value.length) {
      const afterAt = value.substring(lastAtIndex + 1);
      if (!afterAt.includes(" ")) {
        setMentionQuery(afterAt);
        setShowMentions(true);
        return;
      }
    }
    setShowMentions(false);
  };

  const handleMentionSelect = (user: UserSuggestion) => {
    const lastAtIndex = text.lastIndexOf("@");
    const newText = text.substring(0, lastAtIndex) + `@${user.username} `;
    setText(newText);
    setMentionedUsers(prev => [...prev.filter(u => u.id !== user.id), user]);
    setShowMentions(false);
    setMentionQuery("");
    textareaRef.current?.focus();
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image must be less than 5MB");
        return;
      }
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const clearImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async () => {
    if (!text.trim() && !selectedImage) return;
    setPosting(true);
    let imageUrl: string | undefined;
    if (selectedImage) {
      const url = await uploadImage(selectedImage);
      if (url) imageUrl = url;
    }
    await onSubmit(text.trim(), imageUrl, mentionedUsers.map(u => u.id));
    setText("");
    clearImage();
    setMentionedUsers([]);
    setPosting(false);
    onCancel?.();
  };

  return (
    <div className={`bg-card rounded-xl p-4 space-y-3 ${compact ? "p-3" : ""}`}>
      <div className="flex gap-3">
        <Avatar className={compact ? "w-8 h-8" : "w-10 h-10"}>
          <AvatarImage src={profile?.avatar_url || undefined} />
          <AvatarFallback className="bg-primary text-primary-foreground">
            {profile?.username?.charAt(0).toUpperCase() || "?"}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-2">
          <div className="relative">
            <Textarea
              ref={textareaRef}
              placeholder={placeholder || "Write a comment... Use @ to mention users"}
              value={text}
              onChange={handleTextChange}
              className={`bg-muted/50 resize-none ${compact ? "min-h-[60px]" : "min-h-[80px]"}`}
            />
            <AnimatePresence>
              {showMentions && mentionSuggestions.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute left-0 right-0 bottom-full mb-1 bg-popover border border-border rounded-lg shadow-lg z-10 overflow-hidden"
                >
                  {mentionSuggestions.map(user => (
                    <button
                      key={user.id}
                      onClick={() => handleMentionSelect(user)}
                      className="w-full flex items-center gap-2 p-2 hover:bg-muted transition-colors"
                    >
                      <Avatar className="w-6 h-6">
                        <AvatarImage src={user.avatar_url || undefined} />
                        <AvatarFallback className="text-xs">{user.username.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-sm">@{user.username}</span>
                      {user.display_name && <span className="text-xs text-muted-foreground">{user.display_name}</span>}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {imagePreview && (
            <div className="relative inline-block">
              <img src={imagePreview} alt="Preview" className="max-h-32 rounded-lg" />
              <Button variant="destructive" size="icon" className="absolute -top-2 -right-2 h-6 w-6" onClick={clearImage}>
                <X className="w-3 h-3" />
              </Button>
            </div>
          )}

          <div className="flex items-center gap-2">
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
            <Button variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()} className="h-8 w-8">
              <Image className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                if (textareaRef.current) {
                  const pos = textareaRef.current.selectionStart;
                  setText(text.slice(0, pos) + "@" + text.slice(pos));
                  setTimeout(() => {
                    textareaRef.current?.focus();
                    textareaRef.current?.setSelectionRange(pos + 1, pos + 1);
                  }, 0);
                }
              }}
              className="h-8 w-8"
            >
              <AtSign className="w-4 h-4" />
            </Button>
            {onCancel && (
              <Button variant="ghost" size="sm" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button
              onClick={handleSubmit}
              disabled={posting || (!text.trim() && !selectedImage)}
              size="sm"
              className="ml-auto gap-2"
            >
              {posting ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              Post
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface CommentItemProps {
  comment: Comment;
  onReact: (commentId: string, type: "like" | "dislike") => void;
  onDelete: (commentId: string) => void;
  currentUserId?: string;
  isReply?: boolean;
  canReply?: boolean;
  onReply: (content: string, imageUrl?: string, mentionedUserIds?: string[]) => Promise<void>;
  uploadImage: (file: File) => Promise<string | null>;
  profile: { username?: string; avatar_url?: string | null } | null;
}

function CommentItem({
  comment,
  onReact,
  onDelete,
  currentUserId,
  isReply = false,
  canReply = false,
  onReply,
  uploadImage,
  profile,
}: CommentItemProps) {
  const [showReplies, setShowReplies] = useState(true);
  const [showReplyInput, setShowReplyInput] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={isReply ? "ml-12 mt-3" : ""}
    >
      <div className="flex gap-3">
        <Avatar className={isReply ? "w-8 h-8" : "w-10 h-10"}>
          <AvatarImage src={comment.user?.avatar_url || undefined} />
          <AvatarFallback className="bg-muted text-muted-foreground text-sm">
            {comment.user?.username?.charAt(0).toUpperCase() || "?"}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1">
          <div className="bg-card rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-sm">
                {comment.user?.display_name || comment.user?.username || "Anonymous"}
              </span>
              <span className="text-xs text-muted-foreground">@{comment.user?.username}</span>
              <span className="text-xs text-muted-foreground">•</span>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
              </span>
            </div>
            <p className="text-sm whitespace-pre-wrap">
              {comment.content.split(/(@\w+)/g).map((part, i) =>
                part.startsWith("@") ? (
                  <span key={i} className="text-primary font-medium">{part}</span>
                ) : (
                  part
                )
              )}
            </p>
            {comment.image_url && (
              <img src={comment.image_url} alt="Comment attachment" className="mt-2 max-h-64 rounded-lg" />
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 mt-1">
            <Button
              variant="ghost"
              size="sm"
              className={`h-7 px-2 gap-1 ${comment.user_reaction === "like" ? "text-primary" : ""}`}
              onClick={() => onReact(comment.id, "like")}
            >
              <ThumbsUp className="w-3 h-3" />
              {comment.likes_count > 0 && <span>{comment.likes_count}</span>}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={`h-7 px-2 gap-1 ${comment.user_reaction === "dislike" ? "text-destructive" : ""}`}
              onClick={() => onReact(comment.id, "dislike")}
            >
              <ThumbsDown className="w-3 h-3" />
              {comment.dislikes_count > 0 && <span>{comment.dislikes_count}</span>}
            </Button>
            {!isReply && canReply && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 gap-1"
                onClick={() => setShowReplyInput(!showReplyInput)}
              >
                <Reply className="w-3 h-3" />
                Reply
              </Button>
            )}
            {currentUserId === comment.user_id && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-destructive hover:text-destructive"
                onClick={() => onDelete(comment.id)}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            )}
          </div>

          {/* Inline Reply Input */}
          <AnimatePresence>
            {showReplyInput && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-2"
              >
                <CommentInput
                  profile={profile}
                  onSubmit={async (content, imageUrl, mentionedUserIds) => {
                    await onReply(content, imageUrl, mentionedUserIds);
                    setShowReplyInput(false);
                  }}
                  uploadImage={uploadImage}
                  placeholder={`Reply to @${comment.user?.username}...`}
                  onCancel={() => setShowReplyInput(false)}
                  autoFocus
                  compact
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Replies */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-2">
              {!showReplies && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowReplies(true)}
                  className="text-primary text-xs"
                >
                  Show {comment.replies.length} replies
                </Button>
              )}
              <AnimatePresence>
                {showReplies && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    {comment.replies.map((reply) => (
                      <CommentItem
                        key={reply.id}
                        comment={reply}
                        onReact={onReact}
                        onDelete={onDelete}
                        currentUserId={currentUserId}
                        isReply
                        canReply={false}
                        onReply={onReply}
                        uploadImage={uploadImage}
                        profile={profile}
                      />
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
