-- Add course and tags to user_files table
ALTER TABLE public.user_files 
ADD COLUMN course TEXT,
ADD COLUMN tags TEXT[] DEFAULT '{}'::text[];