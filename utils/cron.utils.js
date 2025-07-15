import cron from 'node-cron';
import { sendDailyFeedbackReport } from '../services/gmail.service.js';

// Email recipients for daily reports
const REPORT_RECIPIENTS = [
  'ca.atulseth@gmail.com',
  'sethraghav12345@gmail.com'
];

// Schedule daily report at 11:00 PM IST
// Cron format: second minute hour day month dayOfWeek
// 0 0 23 * * * = Every day at 11:00 PM
const scheduleDailyReport = () => {
  // Schedule for 11:00 PM IST (which is 17:30 UTC)
  cron.schedule('0 0 23 * * *', async () => {
    console.log('🕚 Starting daily feedback report generation at 11:00 PM IST...');
    
    try {
      const result = await sendDailyFeedbackReport(REPORT_RECIPIENTS);
      console.log('✅ Daily report sent successfully:', result);
    } catch (error) {
      console.error('❌ Failed to send daily report:', error);
      
      // Optional: Send error notification to admin
      try {
        await sendErrorNotification(error);
      } catch (notificationError) {
        console.error('❌ Failed to send error notification:', notificationError);
      }
    }
  }, {
    scheduled: true,
    timezone: 'Asia/Kolkata' // Set timezone to IST
  });
  
  console.log('📅 Daily feedback report scheduled for 11:00 PM IST');
};

// Send error notification to admin
const sendErrorNotification = async (error) => {
  try {
    const nodemailer = require('nodemailer');
    
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
      }
    });
    
    const mailOptions = {
      from: {
        name: 'Benares Club Feedback System',
        address: process.env.GMAIL_USER
      },
      to: REPORT_RECIPIENTS[0],
      subject: '🚨 Daily Report Generation Failed',
      html: `
        <h2>Daily Report Generation Failed</h2>
        <p><strong>Time:</strong> ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</p>
        <p><strong>Error:</strong> ${error.message}</p>
        <p><strong>Stack Trace:</strong></p>
        <pre>${error.stack}</pre>
      `
    };
    
    await transporter.sendMail(mailOptions);
    console.log('✅ Error notification sent to admin');
    
  } catch (err) {
    console.error('❌ Failed to send error notification:', err);
  }
};

// Manual trigger for testing
export const triggerDailyReport = async () => {
  console.log('🧪 Manually triggering daily report...');
  
  try {
    const result = await sendDailyFeedbackReport(REPORT_RECIPIENTS);
    console.log('✅ Manual report sent successfully:', result);
    return result;
  } catch (error) {
    console.error('❌ Manual report failed:', error);
    throw error;
  }
};

// Start the cron job
export const startCronJobs = () => {
  console.log('🚀 Starting cron jobs...');
  scheduleDailyReport();
  
  // Optional: Add a test cron that runs every minute for testing
  // Remove this in production
  if (process.env.NODE_ENV === 'development') {
    cron.schedule('* * * * *', () => {
      console.log('🧪 Test cron running every minute (development only)');
    });
  }
};

// Stop all cron jobs
export const stopCronJobs = () => {
  console.log('🛑 Stopping all cron jobs...');
  cron.getTasks().forEach(task => {
    task.stop();
  });
};

export default {
  startCronJobs,
  stopCronJobs,
  triggerDailyReport
};