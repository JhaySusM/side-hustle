# Batjee / TradiGo

Batjee, branded in the UI as TradiGo, is a local marketplace platform built with Next.js, React, Prisma, and PostgreSQL. It supports listing creation, marketplace browsing, favorites, seller profiles, in-app messaging, structured transactions, reporting, referrals, notifications, and an admin backoffice.

## What the project does

- Users register and log in with a JWT cookie.
- Sellers post listings that enter a pending moderation state.
- Admin approves listings before they become publicly visible.
- Buyers browse active listings and contact sellers through in-app chat.
- Conversations can include a transaction lifecycle with dual confirmations, completion tracking, and platform fee submission.
- Users can save favorites, rate sellers, submit reports, and receive in-app notifications.
- Admins manage support, reports, notifications, seller features, and transaction fee verification.

## Tech stack

- Next.js 16 App Router
- React 19
- Prisma ORM
- PostgreSQL
- Reactstrap and Bootstrap
- Cloudinary for image uploads
- Server-Sent Events for inbox refresh

## Main routes

- `/`: Homepage
- `/listings`: Marketplace browsing
- `/product/[id]`: Product detail
- `/seller/[id]`: Seller profile
- `/messages`: Inbox and chat
- `/post`: Create listing
- `/dashboard`: User dashboard
- `/admin`: Admin login and backoffice shell

## Setup

### Required environment variables

- `DATABASE_URL`
- `JWT_SECRET`
- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`
- `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`

### Install and run

```bash
npm install
npm run dev
```

### Other scripts

```bash
npm run build
npm run start
npm run lint
```

## Documentation

Full project documentation is in `docs/PROJECT_DOCUMENTATION.md`.

It covers:

- System overview
- Route and page map
- Data model summary
- Auth and admin behavior
- Messaging and transactions
- Reports, favorites, ratings, referrals, and notifications
- Deployment and maintenance notes
- Current risks and suggested improvements

## Important implementation notes

- New listings start as `Pending` and require admin approval.
- Messaging realtime updates currently rely on SSE plus an in-process event bus.
- The admin backoffice is loaded from `public/admin-backoffice.html`.
- Prisma migrations live under `prisma/migrations`.
- On Windows, `prisma generate` can fail if a running Node process is locking the Prisma engine DLL.
