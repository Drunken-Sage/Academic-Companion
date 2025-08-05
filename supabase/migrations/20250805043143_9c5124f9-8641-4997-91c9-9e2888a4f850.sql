-- Add weekly_study_goal to profiles table
ALTER TABLE public.profiles 
ADD COLUMN weekly_study_goal INTEGER DEFAULT 40;