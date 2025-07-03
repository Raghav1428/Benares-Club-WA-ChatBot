import { supabase } from './index.supabase.js';

export const saveToSupabase = async ({
  from,
  imageUrl = null,
  caption = null,
  category,
  name,
  membershipNumber,
  suggestion,
}) => {
  if (!from || !name || !membershipNumber || !suggestion) {
    console.error("❌ Missing required fields in feedback.");
    return;
  }

  const payload = {
    from_phone: from,
    media_url: imageUrl,
    caption,
    category,
    name,
    membership_number: membershipNumber,
    suggestion,
  };

  const { data, error } = await supabase.from('feedback').insert([payload]);

  if (error) {
    console.error('❌ Supabase insert error:', error);
    console.debug('🔍 Payload:', payload);
  } else {
    console.log('✅ Saved to Supabase:', data);
  }
};

export const uploadToSupabaseStorage = async (fileName, buffer) => {
  try {
    const BUCKET_NAME = 'feedback-images'; // Make sure this matches your bucket name
    
    console.log(`📤 Uploading file: ${fileName} to bucket: ${BUCKET_NAME}`);
    
    // Upload the file
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, buffer, {
        contentType: 'image/jpeg',
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('❌ Upload error:', error);
      throw error;
    }

    console.log('✅ File uploaded successfully:', data);

    // Get the public URL
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(fileName);

    if (!urlData?.publicUrl) {
      throw new Error('Failed to get public URL');
    }

    console.log('✅ Public URL generated:', urlData.publicUrl);
    return urlData.publicUrl;

  } catch (error) {
    console.error('❌ Failed to upload to Supabase Storage:', error);
    throw new Error(`Storage upload failed: ${error.message}`);
  }
};