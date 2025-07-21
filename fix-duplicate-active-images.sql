-- IMMEDIATE FIX FOR DUPLICATE ACTIVE IMAGES
-- Run this in your Supabase SQL Editor to fix the constraint violation

-- 1. First, let's see what users have multiple active images (causing the error)
SELECT 
    user_id,
    COUNT(*) as active_count,
    string_agg(id::text, ', ') as image_ids
FROM public.profile_images 
WHERE is_active = true 
GROUP BY user_id 
HAVING COUNT(*) > 1;

-- 2. Fix it by keeping only the most recent image active per user
UPDATE public.profile_images 
SET is_active = false 
WHERE id NOT IN (
    SELECT DISTINCT ON (user_id) id
    FROM public.profile_images 
    WHERE is_active = true
    ORDER BY user_id, uploaded_at DESC
);

-- 3. Verify the fix worked - this should return no rows
SELECT 
    user_id,
    COUNT(*) as active_count
FROM public.profile_images 
WHERE is_active = true 
GROUP BY user_id 
HAVING COUNT(*) > 1;

-- 4. Show current state - each user should have 0 or 1 active image
SELECT 
    COUNT(DISTINCT user_id) as users_with_active_images,
    COUNT(*) as total_active_images
FROM public.profile_images 
WHERE is_active = true; 