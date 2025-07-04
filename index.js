import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import whatsappRoutes from './routes/whatsapp.routes.js';
import authRoutes from './routes/auth.routes.js'
import feedbackRoutes from './routes/feedback.routes.js'

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));

app.use('/auth', authRoutes);
app.use('/webhook', whatsappRoutes);
app.use('/api/feedback', feedbackRoutes);

const PORT = process.env.PORT || 5000;

app.get('/health', (req,res) => {
  res.json({
    Health: "Fine"
  })
});

app.listen( PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
