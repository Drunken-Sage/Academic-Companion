-- Make user-files bucket public to fix download issues
UPDATE storage.buckets 
SET public = true 
WHERE id = 'user-files';