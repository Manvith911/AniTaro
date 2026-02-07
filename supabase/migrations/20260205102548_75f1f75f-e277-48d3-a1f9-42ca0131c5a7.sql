-- Fix function search paths
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE OR REPLACE FUNCTION public.update_comment_reaction_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.reaction_type = 'like' THEN
      UPDATE public.comments SET likes_count = likes_count + 1 WHERE id = NEW.comment_id;
    ELSE
      UPDATE public.comments SET dislikes_count = dislikes_count + 1 WHERE id = NEW.comment_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.reaction_type = 'like' THEN
      UPDATE public.comments SET likes_count = GREATEST(0, likes_count - 1) WHERE id = OLD.comment_id;
    ELSE
      UPDATE public.comments SET dislikes_count = GREATEST(0, dislikes_count - 1) WHERE id = OLD.comment_id;
    END IF;
  ELSIF TG_OP = 'UPDATE' AND OLD.reaction_type != NEW.reaction_type THEN
    IF NEW.reaction_type = 'like' THEN
      UPDATE public.comments SET likes_count = likes_count + 1, dislikes_count = GREATEST(0, dislikes_count - 1) WHERE id = NEW.comment_id;
    ELSE
      UPDATE public.comments SET dislikes_count = dislikes_count + 1, likes_count = GREATEST(0, likes_count - 1) WHERE id = NEW.comment_id;
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix overly permissive RLS policies
DROP POLICY IF EXISTS "Authenticated users can insert mentions" ON public.comment_mentions;
CREATE POLICY "Authenticated users can insert mentions" ON public.comment_mentions 
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can insert notifications" ON public.notifications;
CREATE POLICY "Authenticated users can insert notifications" ON public.notifications 
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');