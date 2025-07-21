-- DATABASE CONSTRAINT FIX
-- Fix for: duplicate key value violates unique constraint "profile_images_user_id_is_active_key"
-- Run this in your Supabase SQL Editor

CREATE OR REPLACE FUNCTION public.activate_profile_image(image_id UUID)
RETURNS VOID AS $$
DECLARE
    image_user_id UUID;
    image_profile_id UUID;
    image_url TEXT;
BEGIN
    -- Get image details
    SELECT user_id, profile_id, file_path 
    INTO image_user_id, image_profile_id, image_url
    FROM public.profile_images 
    WHERE id = image_id;
    
    -- Check if image exists and user has permission
    IF image_user_id IS NULL THEN
        RAISE EXCEPTION 'Image not found';
    END IF;
    
    IF image_user_id != auth.uid() THEN
        RAISE EXCEPTION 'Permission denied';
    END IF;
    
    -- Use a transaction block to ensure atomicity
    BEGIN
        -- First, deactivate all other profile images for this user
        UPDATE public.profile_images 
        SET is_active = false, updated_at = now()
        WHERE user_id = image_user_id AND id != image_id AND is_active = true;
        
        -- Then activate the selected image
        UPDATE public.profile_images 
        SET is_active = true, updated_at = now()
        WHERE id = image_id;
        
        -- Update profile table with the new image reference
        UPDATE public.profiles 
        SET 
            profile_image_id = image_id,
            profile_image_url = image_url,
            updated_at = now()
        WHERE user_id = image_user_id;
        
    EXCEPTION
        WHEN unique_violation THEN
            -- Handle the unique constraint violation by retrying once
            RAISE NOTICE 'Unique constraint violation detected, retrying...';
            
            -- Force deactivate all images for this user
            UPDATE public.profile_images 
            SET is_active = false, updated_at = now()
            WHERE user_id = image_user_id;
            
            -- Now activate the selected image
            UPDATE public.profile_images 
            SET is_active = true, updated_at = now()
            WHERE id = image_id;
            
            -- Update profile table
            UPDATE public.profiles 
            SET 
                profile_image_id = image_id,
                profile_image_url = image_url,
                updated_at = now()
            WHERE user_id = image_user_id;
    END;
    
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

SELECT 'Profile image constraint fix applied successfully!' as message; 