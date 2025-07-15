import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import whatsappRoutes from './routes/whatsapp.routes.js';
import authRoutes from './routes/auth.routes.js';
import feedbackRoutes from './routes/feedback.routes.js';
import mailRoutes from './routes/mail.routes.js'
import { startCronJobs, stopCronJobs} from './utils/cron.utils.js';

dotenv.config();

startCronJobs();

const app = express();
app.use(express.json());
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));

app.use('/auth', authRoutes);
app.use('/webhook', whatsappRoutes);
app.use('/api/feedback', feedbackRoutes);

//Manual route for triggering the reports
app.use('/', mailRoutes);

const PORT = process.env.PORT || 5000;

process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully...');
  stopCronJobs();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully...');
  stopCronJobs();
  process.exit(0);
});

app.get('/health', (req,res) => {
  res.json({
    Health: "Fine"
  })
});

app.listen( PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
