import cron from 'node-cron';
import nodemailer from 'nodemailer'
import { sendDailyFeedbackReport } from '../services/gmail.service.js';

// Email recipients for daily reports
const getReportRecipients = () => {
  const recipients = process.env.REPORT_RECIPIENTS;
  
  if (!recipients) {
    throw new Error('REPORT_RECIPIENTS environment variable is not set');
  }
  
  return recipients.split(',').map(email => email.trim()).filter(email => email);
};

// Schedule daily report at 11:00 PM IST
const scheduleDailyReport = () => {
  cron.schedule('0 0 23 * * *', async () => {
    console.log('🕚 Starting daily feedback report generation at 11:00 PM IST...');
    
    try {
      const recipients = getReportRecipients();
      const result = await sendDailyFeedbackReport(recipients);
      console.log('✅ Daily report sent successfully:', result);
    } catch (error) {
      console.error('❌ Failed to send daily report:', error);
      
      try {
        await sendErrorNotification(error);
      } catch (notificationError) {
        console.error('❌ Failed to send error notification:', notificationError);
      }
    }
  }, {
    scheduled: true,
    timezone: 'Asia/Kolkata'
  });
  
  console.log('📅 Daily feedback report scheduled for 11:00 PM IST');
};

// Send error notification to admin
const sendErrorNotification = async (error) => {
  try {
    const adminEmail = getReportRecipients()[0];

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
      to: adminEmail,
      subject: 'Daily Report Generation Failed',
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
    const result = await sendDailyFeedbackReport(getReportRecipients());
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