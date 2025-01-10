import { createClient } from '@supabase/supabase-js';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL');
}
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing env.SUPABASE_SERVICE_ROLE_KEY');
}

// Create a Supabase client with the service role key for admin access
export const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
);

export async function uploadImageToStorage(
    imageUrl: string,
    userId: string
): Promise<string | null> {
    try {
        console.log('Starting image upload process...');

        // Fetch the image from the DALL-E URL
        const response = await fetch(imageUrl);
        if (!response.ok) {
            console.error('Failed to fetch image from DALL-E URL:', response.statusText);
            return null;
        }
        const imageBlob = await response.blob();
        console.log('Successfully fetched image from DALL-E');

        // Generate a unique filename with user folder for privacy
        const timestamp = Date.now();
        const filename = `private/${userId}/${timestamp}.png`;
        console.log('Generated filename:', filename);

        // Upload to Supabase Storage
        console.log('Attempting to upload to Supabase...');
        const { error } = await supabase.storage
            .from('intelli-notes-dalle-images')
            .upload(filename, imageBlob, {
                contentType: 'image/png',
                upsert: true,
            });

        if (error) {
            console.error('Detailed upload error:', {
                error,
                bucket: 'intelli-notes-dalle-images',
                filename,
                contentType: 'image/png'
            });
            return null;
        }

        console.log('Upload successful, creating signed URL...');
        // Create a signed URL that expires in 365 days
        const { data: signedData, error: signedError } = await supabase.storage
            .from('intelli-notes-dalle-images')
            .createSignedUrl(filename, 365 * 24 * 60 * 60); // 365 days in seconds

        if (signedError || !signedData) {
            console.error('Error creating signed URL:', signedError);
            return null;
        }

        console.log('Process complete, returning signed URL');
        return signedData.signedUrl;
    } catch (error) {
        console.error('Detailed error in uploadImageToStorage:', error);
        return null;
    }
} 