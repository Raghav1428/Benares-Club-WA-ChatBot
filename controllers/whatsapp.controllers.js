import axios from 'axios';
import { sendTextMessage, sendTemplateMessage, notify } from '../services/whatsapp.services.js';
import { getSession, setSession, clearSession } from '../utils/session.utils.js';
import { saveToSupabase, uploadToSupabaseStorage } from '../supabase/functions.supabase.js';

const hasAllRequiredData = (s) =>
  s.name && s.membershipNumber && s.category && s.suggestion;

export const handleIncomingMessage = async (entry) => {
  const message = entry.messages[0];
  const from = message.from;
  if (message.from_me) return;

  let session = getSession(from) || {};

  if (session.updatedAt && Date.now() - session.updatedAt > 600000) {
    clearSession(from);
    session = {};
  }

  if (session.lastMessageAt && Date.now() - session.lastMessageAt < 1000) return;
  setSession(from, { ...session, lastMessageAt: Date.now(), updatedAt: Date.now() });

  const type = message.type;

  if (!['text', 'image', 'button'].includes(type)) {
    await sendTextMessage(from, "I can only process text, images, or buttons.");
    return;
  }

  if (!session.name && type === 'text' && session.lastTemplate !== 'get_name') {
    await sendTextMessage(from, 'Greetings from *Benares Club*!');
    await sendTextMessage(from, 'Please enter you *name*.');
    setSession(from, { ...session, lastTemplate: 'get_name' });
    return;
  }

  if (type === 'text') {
    const text = message.text.body.trim();

    if (!session.name && session.lastTemplate === 'get_name') {
      setSession(from, { ...session, name: text, lastTemplate: 'get_membership_no' });
      return await sendTextMessage(from, 'Please enter you *membership number*.');
    }

    if (!session.membershipNumber && session.lastTemplate === 'get_membership_no') {
      setSession(from, { ...session, membershipNumber: text, lastTemplate: 'select' });
      return await sendTemplateMessage(from, 'select');
    }

    if (!session.category) return;

    if (!session.suggestion && session.lastTemplate === 'describe_issue') {
      setSession(from, { ...session, suggestion: text, lastTemplate: 'image_upload' });
      return await sendTemplateMessage(from, 'image_upload');
    }

    if (session.awaitingImageUpload) {
      setSession(from, { ...session, awaitingImageUpload: false });
      return await sendTextMessage(from, "Please upload the image.");
    }
  }

  if (type === 'image') {
    const mediaId = message.image.id;
    const caption = message.image.caption?.trim() || null;

    try {
      const url = await getMediaUrl(mediaId);
      const buffer = await downloadMedia(url);
      const fileName = `feedback_${from}_${Date.now()}.jpg`;
      const publicUrl = await uploadToSupabaseStorage(fileName, buffer);

      session = { ...session, imageUrl: publicUrl, caption };
      setSession(from, session);

      if (hasAllRequiredData(session)) {
        await saveToSupabase({
          from,
          imageUrl: session.imageUrl,
          caption,
          category: session.category,
          name: session.name,
          membershipNumber: session.membershipNumber,
          suggestion: session.suggestion,
        });
        await sendTextMessage(from, "Thank you, your feedback has been recorded successfully.");
        await notify(from, session.name, session.membershipNumber);
        clearSession(from);
      } else {
        await sendTextMessage(from, "Got your image. Please type a short description of the issue.");
      }
    } catch (err) {
      console.error("Failed to handle image upload:", err.message);
      await sendTextMessage(from, "Could not process your image.");
    }

    return;
  }

  if (type === 'button') {
    const payload = message.button.payload;
    const lastTemplate = session.lastTemplate;

    if (['Upkeep & Maintenance', 'Others'].includes(payload)) {
      setSession(from, {
        ...session,
        category: payload,
        lastTemplate: 'describe_issue',
      });
      await sendTextMessage(from, `Please describe the issue related to ${payload.toLowerCase()}.`);
      return;
    }

    if (payload === 'Yes' && lastTemplate === 'image_upload') {
      setSession(from, { ...session, awaitingImageUpload: true });
      await sendTextMessage(from, "Please upload the image now.");
      return;
    }

    if (payload === 'No' && lastTemplate === 'image_upload') {
      if (hasAllRequiredData(session)) {
        await saveToSupabase({
          from,
          imageUrl: null,
          caption: null,
          category: session.category,
          name: session.name,
          membershipNumber: session.membershipNumber,
          suggestion: session.suggestion,
        });
        await sendTextMessage(from, "Thank you, your feedback has been recorded successfully.");
        await notify(from, session.name, session.membershipNumber);
        clearSession(from);
      } else {
        await sendTextMessage(from, "Missing some info. Let's restart.");
        clearSession(from);
        await sendTextMessage(from, 'Greetings from *Benares Club*!');
        await sendTextMessage(from, 'Please enter you *name*.');
        setSession(from, { lastTemplate: 'get_name' });
      }
      return;
    }
  }
};

const BASE_URL = 'https://graph.facebook.com/v22.0';

const getMediaUrl = async (mediaId) => {
  try {
    if (!process.env.WHATSAPP_TOKEN) {
      throw new Error('WHATSAPP_ACCESS_TOKEN environment variable not set');
    }

    console.log(`🔍 Fetching media URL for ID: ${mediaId}`);
    
    const response = await axios.get(
      `${BASE_URL}/${mediaId}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
        },
        timeout: 5000,
      }
    );

    if (!response.data || !response.data.url) {
      throw new Error('No URL found in response');
    }

    console.log('✅ Media URL fetched successfully');
    return response.data.url;
    
  } catch (err) {
    console.error('❌ Error fetching media URL:', {
      mediaId,
      status: err.response?.status,
      statusText: err.response?.statusText,
      error: err.response?.data || err.message,
      code: err.code
    });

    if (err.response?.status === 401 || err.response?.data?.error?.code === 190) {
      throw new Error('Access token is invalid or expired. Please refresh your token.');
    } else if (err.response?.status === 404) {
      throw new Error('Media not found. The media may have expired.');
    } else if (err.code === 'ECONNABORTED') {
      throw new Error('Request timeout. Please try again.');
    }
    
    throw new Error(`Unable to fetch media URL: ${err.message}`);
  }
};

const downloadMedia = async (url, retries = 3) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`📥 Downloading media (attempt ${attempt}/${retries})`);
      
      const response = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: 30000,
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
        },
      });

      console.log('✅ Media downloaded successfully');
      return Buffer.from(response.data, 'binary');
      
    } catch (err) {
      console.error(`❌ Download attempt ${attempt} failed:`, err.message);
      
      if (attempt === retries) {
        throw new Error(`Failed to download media after ${retries} attempts: ${err.message}`);
      }

      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
};
