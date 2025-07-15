import { triggerDailyReport } from "../utils/cron.utils.js";

export const sendMail = async (req, res) => {
  try {
    const result = await triggerDailyReport();
    res.json({ 
      success: true, 
      message: 'Daily report sent successfully',
      data: result 
    });
  } catch (error) {
    console.error('Manual report trigger error:', error);
    res.status(500).json({ 
      error: 'Failed to send daily report',
      details: error.message 
    });
  }
};