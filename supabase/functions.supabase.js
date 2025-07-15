import { DateTime } from 'luxon';
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
    console.error("Missing required fields in feedback.");
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
    console.error('Supabase insert error:', error);
    console.debug('Payload:', payload);
  } else {
    console.log('Saved to Supabase:', data);
  }
};

export const uploadToSupabaseStorage = async (fileName, buffer) => {
  try {
    const BUCKET_NAME = 'feedback-images';
    
    console.log(`📤 Uploading file: ${fileName} to bucket: ${BUCKET_NAME}`);
    
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, buffer, {
        contentType: 'image/jpeg',
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Upload error:', error);
      throw error;
    }

    console.log('File uploaded successfully:', data);

    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(fileName);

    if (!urlData?.publicUrl) {
      throw new Error('Failed to get public URL');
    }

    console.log('Public URL generated:', urlData.publicUrl);
    return urlData.publicUrl;

  } catch (error) {
    console.error('Failed to upload to Supabase Storage:', error);
    throw new Error(`Storage upload failed: ${error.message}`);
  }
};

export const getOptinStatus = async (phone) => {
  try {
    const { data, error } = await supabase
      .from('optin') 
      .select('phone_number')
      .eq('phone_number', phone) 
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error checking opt-in status:', error);
      return 'no'; 
    }
    return data ? 'yes' : 'no';
  } catch (error) {
    console.error('Error in getOptinStatus:', error);
    return 'no';
  }
};

export const setOptinStatus = async (phone, status) => {
  try {
    if (status === 'yes') {
      const { data, error } = await supabase
        .from('optin')
        .upsert({ phone_number: phone });

      if (error) {
        console.error('Error setting opt-in status to yes:', error);
        throw error;
      }
      console.log('✅ User opted in:', phone);
      return data;
    } else if (status === 'no') {
      const { data, error } = await supabase
        .from('optin')
        .delete()
        .eq('phone_number', phone);
      if (error) {
        console.error('Error setting opt-in status to no:', error);
        throw error;
      }
      console.log('User opted out:', phone);
      return data;
    }
  } catch (error) {
    console.error('Error in setOptinStatus:', error);
    throw error;
  }
};

export const getDailyFeedbackCount = async (date) => {
  try {
    // Get the date in IST (Asia/Kolkata)
    const targetDate = date || DateTime.now().setZone('Asia/Kolkata').toISODate();

    // Calculate start and end of day in UTC
    const startUTC = DateTime.fromISO(targetDate, { zone: 'Asia/Kolkata' })
      .startOf('day')
      .toUTC()
      .toISO();

    const endUTC = DateTime.fromISO(targetDate, { zone: 'Asia/Kolkata' })
      .endOf('day')
      .toUTC()
      .toISO();

    console.log(`🔍 Querying feedback count for: ${targetDate} (IST) → UTC ${startUTC} to ${endUTC}`);

    const { count, error } = await supabase
      .from('feedback')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startUTC)
      .lt('created_at', endUTC);

    if (error) {
      console.error('❌ Error fetching daily feedback count:', error);
      throw error;
    }

    return count || 0;
  } catch (error) {
    console.error('❌ Error in getDailyFeedbackCount:', error);
    throw error;
  }
};

export const getDailyFeedbackDetails = async (date) => {
  try {
    const targetDate = date || DateTime.now().setZone('Asia/Kolkata').toISODate(); // 'YYYY-MM-DD'

    const start = DateTime.fromISO(targetDate, { zone: 'Asia/Kolkata' }).startOf('day').toUTC().toISO();
    const end = DateTime.fromISO(targetDate, { zone: 'Asia/Kolkata' }).endOf('day').toUTC().toISO();

    console.log("🔍 Query range in UTC:", start, "→", end);

    const { data, error } = await supabase
      .from('feedback')
      .select('name, category, suggestion, created_at')
      .gte('created_at', start)
      .lt('created_at', end)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Supabase fetch error:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('❌ Function error:', error);
    throw error;
  }
};