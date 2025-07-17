import axios from 'axios';

const BASE_URL = process.env.BASE_URL;

export const sendTextMessage = async(to, body) => {
  try {
    const response = await axios({
      url: `https://graph.facebook.com/v22.0/${process.env.PHONE_NUMBER_ID}/messages`,
      method: `post`,
      headers: {
        'Authorization': `Bearer ${process.env.WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json'
      },
      data: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: {
          body
        }
      })
    });
  } catch (err) {
    console.error('Error sending text:', err.response?.data || err.message);
  }
}

export const sendTemplateMessage = async(to, templateName) => {
  try {
    const response = await axios({
      url: `https://graph.facebook.com/v22.0/${process.env.PHONE_NUMBER_ID}/messages`,
      method: `post`,
      headers: {
        'Authorization': `Bearer ${process.env.WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json'
      },
      data: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'template',
        template: {
          name: templateName,
          language: { code: 'en' }
        }
      })
    });
  } catch (err) {
    console.error('Error sending template:', err.response?.data || err.message);
  }
}

export const getMediaUrl = async (mediaId) => {
  try {
    if (!process.env.WHATSAPP_TOKEN) {
      throw new Error('WHATSAPP_ACCESS_TOKEN environment variable not set');
    }

    console.log(`🔍 Fetching media URL for ID: ${mediaId}`);
    
    const response = await axios.get(
      `https://graph.facebook.com/v22.0/${mediaId}`,
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

    console.log('Media URL fetched successfully');
    return response.data.url;
    
  } catch (err) {
    console.error('Error fetching media URL:', {
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

export const downloadMedia = async (url, retries = 3) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`Downloading media (attempt ${attempt}/${retries})`);
      
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
      console.error(`Download attempt ${attempt} failed:`, err.message);
      
      if (attempt === retries) {
        throw new Error(`Failed to download media after ${retries} attempts: ${err.message}`);
      }

      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
};