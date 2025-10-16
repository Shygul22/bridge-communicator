-- Add display_name column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN display_name TEXT;

-- Add avatar_url column for future use
ALTER TABLE public.profiles 
ADD COLUMN avatar_url TEXT;