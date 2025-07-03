import express from 'express';
import { receiveWebhook } from '../webhooks/handler.webhooks.js';

const router = express.Router();
router.route('/')
    .get(receiveWebhook)
    .post(receiveWebhook);

export default router;