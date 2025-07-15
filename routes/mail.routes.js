import express from 'express';
import { sendMail } from '../controllers/mail.controllers.js';
import { authMiddleware } from '../middlewares/auth.middlewares.js';


const router = express.Router();

router.post('/admin/trigger-daily-report',authMiddleware, sendMail);

export default router;