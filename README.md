# Zalo Booking Bot (MVP V1)

**Project Code:** VC-ZBB-1225

## Overview

Zalo Booking Bot is a booking management system integrated with Zalo Official Account (OA) for automated appointment scheduling and customer interaction.

## Tech Stack

- **Frontend:** Next.js 14+ (App Router)
- **Styling:** Tailwind CSS
- **Language:** TypeScript
- **Backend:** Next.js Serverless Functions
- **Database:** PostgreSQL
- **Deployment:** Vercel (recommended)

## Project Structure

```
zalo-booking-bot/
├── docs/          # Documentation
├── src/           # Next.js application code
├── jobs/          # CRON jobs & reminder logic
└── README.md      # This file
```

## Getting Started

### 1. Install Dependencies

```bash
cd src
npm install
```

### 2. Environment Configuration

Copy `.env.example` to `.env.local` trong thư mục `src/`:

```bash
# Copy file
cp ../.env.example .env.local

# Hoặc trên Windows
copy ..\.env.example .env.local
```

**Cấu hình các biến môi trường:**

```bash
# Database (PostgreSQL)
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/zalo_booking_bot"

# NextAuth.js
AUTH_SECRET="your-secret-key"  # Generate: openssl rand -base64 32
AUTH_GOOGLE_ID="your-google-client-id.apps.googleusercontent.com"
AUTH_GOOGLE_SECRET="GOCSPX-your-google-client-secret"
NEXTAUTH_URL="http://localhost:3000"

# Zalo API
ZALO_API_BASE_URL="https://openapi.zalo.me/v3.0/oa"

# Environment
NODE_ENV="development"
```

**Google OAuth Setup:**
1. Truy cập: https://console.cloud.google.com/apis/credentials
2. Tạo OAuth 2.0 Client ID
3. Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`

### 3. Database Setup

```bash
# Tạo PostgreSQL database
psql -U postgres
CREATE DATABASE zalo_booking_bot;
\q

# Push schema
npm run db:push
```

### 4. Run Development Server

```bash
npm run dev
```

Visit http://localhost:3000

## Features (Planned)

- Zalo OA Integration
- Appointment Booking System
- Customer Management
- Automated Reminders
- Admin Dashboard

## License

Proprietary - Vibecode Kit
