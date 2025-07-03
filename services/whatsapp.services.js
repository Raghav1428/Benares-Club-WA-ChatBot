import axios from 'axios';

const BASE_URL = 'https://graph.facebook.com/v22.0';

export const sendTextMessage = async(to, body) => {
  try {
    const response = await axios({
      url: `${BASE_URL}/${process.env.PHONE_NUMBER_ID}/messages`,
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
    console.log(response.data);
  } catch (err) {
    console.error('Error sending text:', err.response?.data || err.message);
  }
}

export const sendTemplateMessage = async(to, templateName) => {
  try {
    const response = await axios({
      url: `${BASE_URL}/${process.env.PHONE_NUMBER_ID}/messages`,
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
    console.log(response.data);
  } catch (err) {
    console.error('Error sending template:', err.response?.data || err.message);
  }
}

export const notify = async (from, name, membershipNumber) => {
  const text = `New feedback recieved:\nFrom: ${from}\nName: ${name}\nMembership No: ${membershipNumber}`;
  const recipients = [919453002988, 919219533844];
  for (const to of recipients) {
    await sendTextMessage(to, text);
  }
};