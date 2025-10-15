-- Add new columns to messages table for enhanced functionality
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS edited_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS parent_message_id UUID REFERENCES public.messages(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS reactions JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- Create index for parent messages (replies)
CREATE INDEX IF NOT EXISTS idx_messages_parent_id ON public.messages(parent_message_id);

-- Create index for pinned messages
CREATE INDEX IF NOT EXISTS idx_messages_pinned ON public.messages(conversation_id, is_pinned) WHERE is_pinned = true;

-- Create conversation_participants table for group chat support
CREATE TABLE IF NOT EXISTS public.conversation_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  role TEXT DEFAULT 'member',
  UNIQUE(conversation_id, user_id)
);

-- Enable RLS on conversation_participants
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;

-- RLS policies for conversation_participants
CREATE POLICY "Users can view participants in their conversations"
  ON public.conversation_participants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversation_participants cp
      WHERE cp.conversation_id = conversation_participants.conversation_id
      AND cp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can add participants to conversations they're in"
  ON public.conversation_participants FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.conversation_participants cp
      WHERE cp.conversation_id = conversation_id
      AND cp.user_id = auth.uid()
    )
  );

-- Add is_group column to conversations
ALTER TABLE public.conversations
ADD COLUMN IF NOT EXISTS is_group BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS group_name TEXT,
ADD COLUMN IF NOT EXISTS group_avatar_url TEXT;

-- Migrate existing conversations to conversation_participants
INSERT INTO public.conversation_participants (conversation_id, user_id, role)
SELECT id, participant1_id, 'admin' FROM public.conversations
ON CONFLICT (conversation_id, user_id) DO NOTHING;

INSERT INTO public.conversation_participants (conversation_id, user_id, role)
SELECT id, participant2_id, 'member' FROM public.conversations
ON CONFLICT (conversation_id, user_id) DO NOTHING;

-- Create typing_indicators table
CREATE TABLE IF NOT EXISTS public.typing_indicators (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(conversation_id, user_id)
);

-- Enable RLS on typing_indicators
ALTER TABLE public.typing_indicators ENABLE ROW LEVEL SECURITY;

-- RLS policies for typing_indicators
CREATE POLICY "Users can view typing in their conversations"
  ON public.typing_indicators FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversation_participants cp
      WHERE cp.conversation_id = typing_indicators.conversation_id
      AND cp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own typing status"
  ON public.typing_indicators FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own typing status"
  ON public.typing_indicators FOR DELETE
  USING (auth.uid() = user_id);

-- Enable realtime for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE public.typing_indicators;

-- Update existing realtime for messages (if not already added)
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;