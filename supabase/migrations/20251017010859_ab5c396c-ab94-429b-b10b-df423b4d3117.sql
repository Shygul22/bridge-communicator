-- Fix infinite recursion in conversation_participants policies
-- Drop the problematic policies
DROP POLICY IF EXISTS "Users can add participants to conversations they're in" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can view participants in their conversations" ON public.conversation_participants;

-- Create simpler, non-recursive policies
-- Users can view conversation participants if they're part of the conversation
CREATE POLICY "Users can view conversation participants"
ON public.conversation_participants
FOR SELECT
USING (
  conversation_id IN (
    SELECT id FROM public.conversations
    WHERE participant1_id = auth.uid() OR participant2_id = auth.uid()
  )
);

-- Users can add participants to conversations they're part of
CREATE POLICY "Users can add conversation participants"
ON public.conversation_participants
FOR INSERT
WITH CHECK (
  conversation_id IN (
    SELECT id FROM public.conversations
    WHERE participant1_id = auth.uid() OR participant2_id = auth.uid()
  )
);