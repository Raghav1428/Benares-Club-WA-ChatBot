<div align="center">

# 🏛️ Benares Club WhatsApp Feedback Bot

![Node.js](https://img.shields.io/badge/Node.js-339933?logo=node.js&logoColor=white&style=flat-square)
![Express](https://img.shields.io/badge/Express.js-000000?logo=express&logoColor=white&style=flat-square)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?logo=supabase&logoColor=white&style=flat-square)
![Docker](https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=white&style=flat-square)
![WhatsApp](https://img.shields.io/badge/WhatsApp-25D366?logo=whatsapp&logoColor=white&style=flat-square)

*Streamline member feedback collection through WhatsApp with automated reports and admin management*

</div>

---

## 📖 Overview

The **Benares Club WhatsApp Feedback Bot** is a comprehensive automated system designed to collect, manage, and analyze member feedback through WhatsApp. Built with modern technologies, it provides a seamless experience for club members to submit suggestions, complaints, and feedback while offering powerful administrative tools for review and reporting.

### 🎯 Key Benefits
- **Effortless Communication**: Members can submit feedback directly through WhatsApp
- **Structured Data Collection**: Automated forms ensure consistent feedback format
- **Real-time Processing**: Instant feedback storage and acknowledgment
- **Automated Reporting**: Daily summaries delivered to administrators
- **Admin Dashboard**: Comprehensive tools for feedback management and analytics

---

## ✨ Features

### 🤖 WhatsApp Integration
- **Interactive Bot**: Conversational interface using Meta's WhatsApp Business API
- **Media Support**: Upload images with feedback submissions
- **Real-time Responses**: Instant acknowledgment and guidance messages
- **Webhook Processing**: Secure message handling and validation

### 📋 Feedback Management
- **Structured Forms**: Collect name, membership number, category, and suggestions
- **Image Uploads**: Automatic media storage in Supabase
- **Database Storage**: Persistent feedback storage with timestamps
- **Categorization**: Organize feedback by type and priority

### 📊 Admin Tools
- **Authentication**: JWT-based secure admin access
- **Statistics Dashboard**: Real-time analytics and metrics
- **Filtering & Search**: Advanced feedback filtering capabilities
- **Report Generation**: Automated daily email reports
- **Data Export**: Export feedback data for analysis

### ⚙️ System Features
- **Scheduled Tasks**: Automated daily reports using node-cron
- **Email Notifications**: SMTP-based email delivery system
- **Docker Support**: Containerized deployment for easy scaling
- **Error Handling**: Comprehensive error logging and recovery

---

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `PORT` | Express server port | ✅ | `3000` |
| `SUPABASE_URL` | Supabase project URL | ✅ | `https://xxx.supabase.co` |
| `SUPABASE_ANON_KEY` | Supabase public API key | ✅ | `eyJhbGciOiJ...` |
| `WHATSAPP_TOKEN` | Meta WhatsApp Business token | ✅ | `EAAF...` |
| `PHONE_NUMBER_ID` | WhatsApp sender phone ID | ✅ | `123456789` |
| `GMAIL_USER` | Gmail address for reports | ✅ | `admin@benaresclub.com` |
| `GMAIL_APP_PASSWORD` | Gmail app password | ✅ | `abcd efgh ijkl mnop` |
| `REPORT_RECIPIENTS` | Email recipients (comma-separated) | ✅ | `admin@club.com,manager@club.com` |
| `JWT_SECRET_KEY` | JWT signing secret | ✅ | `your-secret-key` |
| `WHATSAPP_WEBHOOK_SECRET` | Webhook verification token | ✅ | `your-webhook-secret` |

---

## 📚 API Documentation

### Webhook Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/webhook` | WhatsApp message webhook |
| `GET` | `/webhook` | Webhook verification |

### Admin Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/auth/login` | Admin authentication | ❌ |
| `GET` | `/api/feedback` | Get all feedback | ✅ |
| `GET` | `/api/feedback/stats` | Get statistics | ✅ |
| `POST` | `/admin/trigger-daily-report` | Manual report generation | ✅ |

### Example API Responses

<details>
<summary>GET /api/feedback/stats</summary>

```json
{
  "total_feedback": 150,
  "today_feedback": 12,
  "categories": {
    "complaint": 45,
    "suggestion": 78,
    "compliment": 27
  },
  "monthly_trend": [
    {"month": "Jan", "count": 42},
    {"month": "Feb", "count": 38}
  ]
}
```
</details>

---


## 🧩 Tech Stack

| Technology | Purpose | Version |
|------------|---------|---------|
| **Node.js** | Backend runtime | 22.13.1 |
| **Express.js** | Web framework | 4.18.2 |
| **Supabase** | Database & Storage | Latest |
| **Docker** | Containerization | Latest |
| **WhatsApp API** | Messaging interface | v22.0 |
| **Luxon** | Date/time handling | 3.7.1 |
| **Nodemailer** | Email delivery | 7.0.5 |
| **node-cron** | Task scheduling | 4.2.1 |
| **JWT** | Authentication | 9.0.2 |

---

## 📈 Monitoring & Analytics

### Key Metrics Tracked
- Daily feedback submissions
- Response times
- Error rates
- Category distribution
- Member engagement

### Logging
All activities are logged with structured JSON format for easy analysis.

---

## 👨‍💻 Contributors

<div align="center">

**Raghav** - *Creator & Lead Developer*

[![GitHub](https://img.shields.io/badge/GitHub-raghav1428-181717?logo=github&logoColor=white)](https://github.com/raghav1428)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-0077B5?logo=linkedin&logoColor=white)](https://www.linkedin.com/in/raghav-seth-a49902205)

</div>

---

## 🙏 Acknowledgments

- Meta WhatsApp Business API team
- Benares Club for the opportunity

---

## ⚠️ License & Usage

This project is **not open source**. The code is available publicly **only for review and demonstration purposes** (e.g., internship evaluation). Any form of **unauthorized use, redistribution, or modification is strictly prohibited**.

To seek permission or clarification, contact [Benares Club](mailto:suggestion.bc@gmail.com).


---

<div align="center">

*Made with ❤️ for Benares Club members*

</div>
