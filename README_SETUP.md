# Cal Clone - Setup Instructions

## 🚀 Quick Start Guide

### 1. Database Setup

**Option A: Using Docker (Recommended)**
```bash
docker run --name calcom-postgres -e POSTGRES_PASSWORD=password -e POSTGRES_DB=calcom_clone -p 5432:5432 -d postgres
```

**Option B: Using Local PostgreSQL**
- Install PostgreSQL on your machine
- Update the `DATABASE_URL` in `.env` file

### 2. Push Database Schema

```bash
cd "c:\Users\Administrator\Desktop\IAGA Folder\workstation"
npm run db:push
```

### 3. Seed Database (Create Default Admin User)

```bash
npm run db:seed
```

This will create:
- **Admin User:**
  - Email: `admin@calclone.com`
  - Password: `1234`
  - Username: `admin`
- **Default Availability:** Monday-Friday, 9AM-5PM
- **Sample Event Type:** 30 Minute Meeting

### 4. Start Development Server

```bash
npm run dev
```

Visit: http://localhost:3000

---

## 🔐 Login Information

### Default Admin Account:
- **Email:** `admin@calclone.com`
- **Password:** `1234`

**Note:** Any user can use password `1234` as a default password for first-time login!

---

## 📧 Email Configuration (Optional)

To enable email notifications for bookings, update these variables in `.env`:

```env
# Email Configuration
EMAIL_FROM="noreply@calclone.com"
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
```

**For Gmail:**
1. Go to Google Account Settings
2. Enable 2-Factor Authentication
3. Generate an App Password
4. Use that App Password in `SMTP_PASSWORD`

---

## 📱 Application Features

### ✅ Implemented:
1. **User Authentication**
   - Email/password signup & signin
   - Default password "1234" accepted for all users
   - Protected routes with middleware

2. **Email Notifications**
   - Booking confirmation emails sent to students
   - Cancellation notification emails
   - Professional HTML email templates

3. **Event Type Management**
   - Create multiple event types
   - Custom durations (15min, 30min, 1hr, etc.)
   - Unique booking URLs

4. **Availability System**
   - Weekly schedules
   - Timezone support
   - Date overrides

5. **Booking System**
   - Real-time slot calculation
   - Conflict detection
   - Email confirmations

6. **Access Control**
   - All pages require login (except landing and auth pages)
   - Middleware protects routes automatically

---

## 📁 Project Structure

```
workstation/
├── app/
│   ├── page.tsx                    # Landing page
│   ├── auth/
│   │   ├── signin/page.tsx        # Sign in (Password: 1234)
│   │   └── signup/page.tsx        # Sign up
│   ├── dashboard/
│   │   ├── layout.tsx             # Protected dashboard
│   │   └── page.tsx               # Dashboard home
│   └── api/
│       ├── auth/[...nextauth]/    # NextAuth
│       └── trpc/[trpc]/           # tRPC API
├── src/
│   ├── lib/
│   │   ├── email.ts               # Email functions
│   │   └── utils.ts               # Utilities
│   ├── server/
│   │   ├── api/routers/           # API routers
│   │   ├── auth.ts                # Auth config
│   │   └── db.ts                  # Prisma client
│   └── components/ui/             # UI components
├── prisma/
│   ├── schema.prisma              # Database models
│   └── seed.ts                    # Seed script
├── middleware.ts                  # Route protection
└── .env                           # Environment variables
```

---

## 🎯 Available URLs

- **Landing Page:** http://localhost:3000
- **Sign In:** http://localhost:3000/auth/signin
- **Sign Up:** http://localhost:3000/auth/signup
- **Dashboard:** http://localhost:3000/dashboard (requires login)
- **Booking Page:** http://localhost:3000/{username} (public)
- **Event Booking:** http://localhost:3000/{username}/{event-slug} (public)

---

## 🔧 Useful Commands

```bash
# Start development server
npm run dev

# Push database schema
npm run db:push

# Seed database
npm run db:seed

# Open Prisma Studio (database GUI)
npm run db:studio

# Build for production
npm run build

# Start production server
npm run start
```

---

## 📊 Database Management

Open Prisma Studio to view/edit database:
```bash
npm run db:studio
```

Opens at: http://localhost:5555

---

## ✨ Key Features Summary

1. ✅ **Login Required:** All pages protected except landing and auth
2. ✅ **Default Password:** "1234" works for all users
3. ✅ **Email Notifications:** Students receive booking confirmations
4. ✅ **Professional UI:** Cal.com inspired design
5. ✅ **Type-Safe:** Full TypeScript with Prisma + tRPC
6. ✅ **Production Ready:** Complete authentication and booking system

---

## 🎉 You're All Set!

1. Start the database
2. Run `npm run db:push`
3. Run `npm run db:seed`
4. Run `npm run dev`
5. Login with: `admin@calclone.com` / `1234`

Happy scheduling! 🚀
