import nodemailer from 'nodemailer';
import { getDailyFeedbackCount, getDailyFeedbackDetails } from '../supabase/functions.supabase.js';

const createGmailTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD
    }
  });
};

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'Asia/Kolkata'
  });
};

const formatTime = (date) => {
  return new Date(date).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Kolkata'
  });
};

const generateEmailHTML = (feedbackCount, feedbackDetails, date) => {
  const formattedDate = formatDate(date);
  
  let feedbackHTML = '';
  if (feedbackDetails && feedbackDetails.length > 0) {
    feedbackHTML = `
      <h3>Feedback Details:</h3>
      <table style="border-collapse: collapse; width: 100%; margin-top: 20px;">
        <thead>
          <tr style="background-color: #f5f5f5;">
            <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Time</th>
            <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Name</th>
            <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Membership No.</th>
            <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Category</th>
            <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Suggestion</th>
          </tr>
        </thead>
        <tbody>
          ${feedbackDetails.map(feedback => `
            <tr>
              <td style="border: 1px solid #ddd; padding: 12px;">${formatTime(feedback.created_at)}</td>
              <td style="border: 1px solid #ddd; padding: 12px;">${feedback.name}</td>
              <td style="border: 1px solid #ddd; padding: 12px;">${feedback.membership_number}</td>
              <td style="border: 1px solid #ddd; padding: 12px;">${feedback.category}</td>
              <td style="border: 1px solid #ddd; padding: 12px; max-width: 300px; word-wrap: break-word;">${feedback.suggestion}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  } else {
    feedbackHTML = '<p style="color: #666; font-style: italic;">No feedback received today.</p>';
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Daily Feedback Report</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #2c5530; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h1 style="margin: 0; font-size: 24px;">Daily Feedback Report</h1>
        <p style="margin: 10px 0 0 0; font-size: 16px;">Benares Club - ${formattedDate}</p>
      </div>
      
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h2 style="color: #2c5530; margin-top: 0;">Summary</h2>
        <p style="font-size: 18px; margin: 10px 0;">
          <strong>Total Feedbacks Received:</strong> 
          <span style="background-color: #2c5530; color: white; padding: 5px 10px; border-radius: 4px; font-weight: bold;">${feedbackCount}</span>
        </p>
      </div>
      
      <div style="background-color: white; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
        ${feedbackHTML}
      </div>
      
      <div style="margin-top: 20px; padding: 20px; background-color: #f8f9fa; border-radius: 8px; text-align: center;">
        <p style="margin: 0; color: #666; font-size: 14px;">
          This is an automated report generated at 11:00 PM IST<br>
          Benares Club Feedback System
        </p>
      </div>
    </body>
    </html>
  `;
};

// Send daily feedback report
export const sendDailyFeedbackReport = async (recipientEmails = []) => {
  try {
    // Get today's date in IST
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    
    // Get feedback count and details
    const feedbackCount = await getDailyFeedbackCount(today);
    const feedbackDetails = await getDailyFeedbackDetails(today);
    
    // Create transporter
    const transporter = createGmailTransporter();
    
    // Generate email content
    const htmlContent = generateEmailHTML(feedbackCount, feedbackDetails, today);

    const mailOptions = {
      from: {
        name: 'Benares Club Feedback System',
        address: process.env.GMAIL_USER
      },
      to: recipientEmails.join(', '),
      subject: `Daily Feedback Report - ${formatDate(today)} (${feedbackCount} feedbacks)`,
      html: htmlContent
    };
    
    const info = await transporter.sendMail(mailOptions);
    
    console.log('✅ Daily feedback report sent successfully:', info.messageId);
    console.log(`📊 Report summary: ${feedbackCount} feedbacks on ${formatDate(today)}`);
    
    return {
      success: true,
      messageId: info.messageId,
      feedbackCount,
      date: today
    };
    
  } catch (error) {
    console.error('❌ Error sending daily feedback report:', error);
    throw error;
  }
};

export const sendTestReport = async (recipientEmails = []) => {
  try {
    console.log('🧪 Sending test report...');
    const result = await sendDailyFeedbackReport(recipientEmails);
    console.log('✅ Test report sent successfully!');
    return result;
  } catch (error) {
    console.error('❌ Test report failed:', error);
    throw error;
  }
};