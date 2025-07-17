import { sendTextMessage, sendTemplateMessage, getMediaUrl, downloadMedia } from '../services/whatsapp.services.js';
import { getSession, setSession, clearSession } from '../utils/session.utils.js';
import { saveToSupabase, uploadToSupabaseStorage, getOptinStatus, setOptinStatus } from '../supabase/functions.supabase.js';

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

  if (!session.optinChecked) {
    const optinStatus = await getOptinStatus(from);
    session.optinStatus = optinStatus;
    session.optinChecked = true;
    setSession(from, session);

    if (optinStatus === 'no') {
      await sendTemplateMessage(from, 'opt_in'); 
      return;
    }
  }

  if (session.optinStatus === 'no' && type === 'button') {
    const payload = message.button.payload;
    
    if (payload === 'Yes') {
      await setOptinStatus(from, 'yes');
      session.optinStatus = 'yes';
      setSession(from, session);

      await sendTextMessage(from, 'Thank you for opting in!');
      await sendTextMessage(from, 'Greetings from *Benares Club*!');
      await sendTextMessage(from, 'Please enter your *name*.');
      setSession(from, { ...session, lastTemplate: 'get_name' });
      return;
    }
    
    if (payload === 'No') {
      await setOptinStatus(from, 'no');
      await sendTextMessage(from, `Thank you. You will not receive further messages. If you wish to submit feedbacks please *opt in*`);
      clearSession(from);
      return;
    }
  }

  if (session.optinStatus === 'no') {
    await sendTextMessage(from, 'Please opt-in to continue using our services.');
    return;
  }

  if (!session.name && type === 'text' && session.lastTemplate !== 'get_name') {
    await sendTextMessage(from, 'Greetings from *Benares Club*!');
    await sendTextMessage(from, 'Please enter your *name*.');
    setSession(from, { ...session, lastTemplate: 'get_name' });
    return;
  }

  if (type === 'text') {
    const text = message.text.body.trim();

    if (text.toLowerCase() === 'stop') {
      await setOptinStatus(from, 'no');
      await sendTextMessage(from, `We respect your choice. You won't receive further messages and will not be able to submit feedbacks until you *opt in*.`);
      clearSession(from);
      return;
    }

    if (!session.name && session.lastTemplate === 'get_name') {
      setSession(from, { ...session, name: text, lastTemplate: 'get_membership_no' });
      return await sendTextMessage(from, 'Please enter your *membership number*.');
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
        clearSession(from);
      } else {
        await sendTextMessage(from, "Missing some info. Let's restart.");
        clearSession(from);
        await sendTextMessage(from, 'Greetings from *Benares Club*!');
        await sendTextMessage(from, 'Please enter your *name*.');
        setSession(from, { lastTemplate: 'get_name' });
      }
      return;
    }
  }
};