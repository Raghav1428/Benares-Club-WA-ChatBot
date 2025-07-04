import { handleIncomingMessage } from '../controllers/whatsapp.controllers.js';

export const receiveWebhook = async (req, res) => {
  console.log(`📨 Received ${req.method} request`);
  console.log('🔍 Headers:', req.headers);
  console.log('🔍 Query params:', req.query);

  if (req.method === 'GET') {
    const VERIFY_TOKEN = process.env.WHATSAPP_WEBHOOK_SECRET;

    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    console.log('Verification attempt:', { mode, token, challenge });

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('Webhook verified by Meta');
      return res.status(200).send(challenge);
    } else {
      console.log('Webhook verification failed');
      console.log('Expected token:', VERIFY_TOKEN);
      console.log('Received token:', token);
      return res.sendStatus(403);
    }
  }

  if (req.method === 'POST') {
    console.log('Incoming WhatsApp message:', JSON.stringify(req.body, null, 2));
    
    try {
      const entry = req.body?.entry?.[0]?.changes?.[0]?.value;
      console.log('Extracted entry:', JSON.stringify(entry, null, 2));
      
      if (entry?.messages) {
        console.log('Processing messages...');
        await handleIncomingMessage(entry);
      } else {
        console.log('⚠️ No messages found in entry');
      }
      
      res.sendStatus(200);
    } catch (err) {
      console.error('Webhook error:', err);
      console.error('Stack trace:', err.stack);
      res.sendStatus(500);
    }
  }
};